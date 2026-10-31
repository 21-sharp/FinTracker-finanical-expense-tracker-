package com.fintrack.controller;

import com.fintrack.entity.PaymentAccount;
import com.fintrack.repository.PaymentAccountRepository;
import com.fintrack.dto.TransactionDto;
import com.fintrack.entity.Transaction;
import com.fintrack.entity.User;
import com.fintrack.repository.TransactionRepository;
import com.fintrack.repository.UserRepository;
import com.fintrack.security.SecurityUtils;
import com.itextpdf.text.pdf.PdfReader;
import com.itextpdf.text.pdf.parser.PdfTextExtractor;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class SqlUploadController {

    private static final List<String> SUPPORTED_EXTENSIONS = List.of(".sql", ".csv", ".xlsx", ".xls", ".pdf");
    private static final List<String> EXPENSE_KEYWORDS = List.of(
            "EXPENSE", "EXPENSES", "DEBIT", "WITHDRAW", "WITHDRAWAL", "PAID", "PAYMENT", "PURCHASE",
            "BILL", "EMI", "SHOPPING", "GROCERY", "GROCERIES", "FOOD", "RESTAURANT", "DINING",
            "TRAVEL", "TRANSPORT", "FUEL", "PETROL", "DIESEL", "RENT", "UTILITIES", "ELECTRICITY",
            "WATER", "INTERNET", "MOBILE", "PHONE", "HEALTHCARE", "MEDICAL", "DOCTOR", "MEDICINE",
            "INSURANCE", "SUBSCRIPTION", "TAX", "LOAN", "MORTGAGE", "CARD", "FEE", "CHARGE",
            "ENTERTAINMENT", "MOVIE", "EDUCATION", "SCHOOL", "COLLEGE"
    );
    private static final List<String> INCOME_KEYWORDS = List.of(
            "INCOME", "CREDIT", "DEPOSIT", "RECEIVED", "SALARY", "BONUS", "REFUND", "FREELANCE",
            "INTEREST", "DIVIDEND", "PROFIT", "INCENTIVE", "ALLOWANCE", "COMMISSION"
    );

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final PaymentAccountRepository paymentAccountRepository;
    private final SecurityUtils securityUtils;

    @PostMapping({"/sql", "/transactions"})
    public ResponseEntity<Map<String, Object>> uploadTransactionFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Please select a file to upload.");
        }

        String filename = file.getOriginalFilename();
        String extension = getExtension(filename);
        if (!SUPPORTED_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("Only SQL, CSV, Excel, and PDF files are supported.");
        }

        try {
            Long userId = securityUtils.getCurrentUserId();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Transaction> imported = switch (extension) {
                case ".sql" -> parseSqlAndCreateTransactions(new String(file.getBytes(), StandardCharsets.UTF_8), user);
                case ".csv" -> parseDelimitedText(new String(file.getBytes(), StandardCharsets.UTF_8), user);
                case ".xlsx", ".xls" -> parseExcel(file.getBytes(), user);
                case ".pdf" -> parsePdf(file.getBytes(), user);
                default -> List.of();
            };

            if (imported.isEmpty()) {
                throw new RuntimeException("No valid transactions were found in the uploaded file.");
            }

            // 1. Prevent duplicate file uploads
            List<Transaction> uniqueImported = new ArrayList<>();
            int skippedCount = 0;
            for (Transaction t : imported) {
                boolean exists = transactionRepository.existsByUserIdAndTitleAndAmountAndTypeAndDate(
                        user.getId(),
                        t.getTitle(),
                        t.getAmount(),
                        t.getType(),
                        t.getDate()
                );
                if (!exists) {
                    uniqueImported.add(t);
                } else {
                    skippedCount++;
                }
            }

            if (uniqueImported.isEmpty()) {
                throw new RuntimeException("No new transactions found; all transactions in this file have already been imported.");
            }

            imported = uniqueImported;

            // 2. Fetch or create user payment accounts
            List<PaymentAccount> userAccounts = paymentAccountRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            if (userAccounts.isEmpty()) {
                PaymentAccount defaultAccount = PaymentAccount.builder()
                        .name("Primary Account")
                        .type(PaymentAccount.AccountType.BANK_ACCOUNT)
                        .balance(BigDecimal.ZERO)
                        .user(user)
                        .build();
                defaultAccount = paymentAccountRepository.save(defaultAccount);
                userAccounts = new ArrayList<>(List.of(defaultAccount));
            }

            // 3. Update balances and associate accounts
            for (Transaction t : imported) {
                PaymentAccount matchedAccount = null;
                String method = t.getPaymentMethod() != null ? t.getPaymentMethod().trim() : "";
                
                // Match by exact name
                for (PaymentAccount acc : userAccounts) {
                    if (acc.getName().equalsIgnoreCase(method)) {
                        matchedAccount = acc;
                        break;
                    }
                }
                
                // Match by type keywords if no name match
                if (matchedAccount == null) {
                    for (PaymentAccount acc : userAccounts) {
                        if (acc.getType().name().equalsIgnoreCase(method.replace(" ", "_")) ||
                            (method.equalsIgnoreCase("Cash") && acc.getType() == PaymentAccount.AccountType.CASH) ||
                            (method.equalsIgnoreCase("Credit Card") && acc.getType() == PaymentAccount.AccountType.CREDIT_CARD) ||
                            (method.equalsIgnoreCase("Debit Card") && acc.getType() == PaymentAccount.AccountType.BANK_ACCOUNT) ||
                            (method.equalsIgnoreCase("Bank Transfer") && acc.getType() == PaymentAccount.AccountType.BANK_ACCOUNT) ||
                            (method.equalsIgnoreCase("UPI") && acc.getType() == PaymentAccount.AccountType.BANK_ACCOUNT) ||
                            (method.equalsIgnoreCase("Wallet") && acc.getType() == PaymentAccount.AccountType.WALLET)) {
                            matchedAccount = acc;
                            break;
                        }
                    }
                }
                
                // Fallback to first available account
                if (matchedAccount == null) {
                    matchedAccount = userAccounts.get(0);
                }

                t.setAccount(matchedAccount);
                if (t.getType() == Transaction.TransactionType.EXPENSE) {
                    matchedAccount.setBalance(matchedAccount.getBalance().subtract(t.getAmount()));
                } else {
                    matchedAccount.setBalance(matchedAccount.getBalance().add(t.getAmount()));
                }
                paymentAccountRepository.save(matchedAccount);
            }

            transactionRepository.saveAll(imported);

            Map<String, Object> response = new HashMap<>();
            String message = "Successfully imported " + imported.size() + " transactions.";
            if (skippedCount > 0) {
                message += " (" + skippedCount + " duplicates skipped)";
            }
            response.put("message", message);
            response.put("count", imported.size());
            response.put("transactions", imported.stream().map(this::mapToDto).toList());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process " + extension.toUpperCase(Locale.ROOT).substring(1) + " file: " + e.getMessage());
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.')).toLowerCase(Locale.ROOT);
    }

    private List<Transaction> parseSqlAndCreateTransactions(String content, User user) {
        List<Transaction> transactions = new ArrayList<>();
        Pattern insertPattern = Pattern.compile(
                "INSERT\\s+INTO\\s+[\\w`.]+\\s*\\(([^)]*)\\)\\s*VALUES\\s*(.+?);",
                Pattern.CASE_INSENSITIVE | Pattern.DOTALL
        );

        Matcher matcher = insertPattern.matcher(content);
        while (matcher.find()) {
            List<String> columns = parseDelimitedLine(matcher.group(1));
            for (String tuple : splitSqlValueTuples(matcher.group(2))) {
                List<String> values = parseDelimitedLine(tuple);
                Transaction transaction = createTransaction(columns, values, user, "SQL Import");
                if (transaction != null) {
                    transactions.add(transaction);
                }
            }
        }

        return transactions;
    }

    private List<String> splitSqlValueTuples(String valuesBlock) {
        List<String> tuples = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inSingleQuotes = false;
        boolean inDoubleQuotes = false;
        int depth = 0;

        for (int i = 0; i < valuesBlock.length(); i++) {
            char c = valuesBlock.charAt(i);
            if (c == '\'' && !inDoubleQuotes) {
                inSingleQuotes = !inSingleQuotes;
                if (depth > 0) current.append(c);
            } else if (c == '"' && !inSingleQuotes) {
                inDoubleQuotes = !inDoubleQuotes;
                if (depth > 0) current.append(c);
            } else if (c == '(' && !inSingleQuotes && !inDoubleQuotes) {
                if (depth > 0) current.append(c);
                depth++;
            } else if (c == ')' && !inSingleQuotes && !inDoubleQuotes) {
                depth--;
                if (depth == 0) {
                    tuples.add(current.toString());
                    current = new StringBuilder();
                } else if (depth > 0) {
                    current.append(c);
                }
            } else if (depth > 0) {
                current.append(c);
            }
        }

        return tuples;
    }

    private List<Transaction> parseDelimitedText(String content, User user) {
        List<Transaction> transactions = new ArrayList<>();
        String normalized = content.replace("\uFEFF", "");
        String[] lines = normalized.split("\\R");
        List<String> headers = List.of();
        boolean headerDetected = false;

        for (String line : lines) {
            if (line == null || line.trim().isEmpty()) {
                continue;
            }

            List<String> cells = parseDelimitedLine(line);
            if (cells.isEmpty()) {
                continue;
            }

            if (!headerDetected && looksLikeHeader(cells)) {
                headers = cells;
                headerDetected = true;
                continue;
            }

            Transaction transaction = createTransaction(headers, cells, user, "CSV Import");
            if (transaction != null) {
                transactions.add(transaction);
            }
        }

        return transactions;
    }

    private List<Transaction> parseExcel(byte[] bytes, User user) {
        List<Transaction> transactions = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            List<String> headers = List.of();
            boolean headerDetected = false;

            for (Row row : sheet) {
                List<String> cells = readExcelRow(row);
                if (cells.stream().allMatch(String::isBlank)) {
                    continue;
                }

                if (!headerDetected && looksLikeHeader(cells)) {
                    headers = cells;
                    headerDetected = true;
                    continue;
                }

                Transaction transaction = createTransaction(headers, cells, user, "Excel Import");
                if (transaction != null) {
                    transactions.add(transaction);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Unable to read Excel workbook: " + e.getMessage(), e);
        }

        return transactions;
    }

    private List<String> readExcelRow(Row row) {
        List<String> values = new ArrayList<>();
        short lastCell = row.getLastCellNum();
        for (int i = 0; i < lastCell; i++) {
            Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            values.add(readExcelCell(cell));
        }
        return values;
    }

    private String readExcelCell(Cell cell) {
        if (cell == null) {
            return "";
        }
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate().toString();
        }
        cell.setCellType(CellType.STRING);
        return cell.getStringCellValue().trim();
    }

    private List<Transaction> parsePdf(byte[] bytes, User user) {
        StringBuilder text = new StringBuilder();
        try {
            PdfReader reader = new PdfReader(bytes);
            for (int i = 1; i <= reader.getNumberOfPages(); i++) {
                text.append(PdfTextExtractor.getTextFromPage(reader, i)).append('\n');
            }
            reader.close();
        } catch (Exception e) {
            throw new RuntimeException("Unable to read PDF text: " + e.getMessage(), e);
        }

        List<Transaction> parsed = parseDelimitedText(text.toString(), user);
        if (!parsed.isEmpty()) {
            return parsed;
        }

        return parsePdfStatementLines(text.toString(), user);
    }

    private List<Transaction> parsePdfStatementLines(String text, User user) {
        List<Transaction> transactions = new ArrayList<>();
        Pattern linePattern = Pattern.compile(
                "^(.+?)\\s{2,}(.+?)\\s{2,}(INCOME|EXPENSE)\\s{2,}([+-]?(?:INR|Rs\\.?|₹)?\\s*[0-9,.]+)\\s{2,}(\\d{4}-\\d{2}-\\d{2}|\\d{2}[-/]\\d{2}[-/]\\d{4})\\s{2,}(.+)$",
                Pattern.CASE_INSENSITIVE
        );

        for (String line : text.split("\\R")) {
            Matcher matcher = linePattern.matcher(line.trim());
            if (!matcher.find()) {
                continue;
            }

            List<String> headers = List.of("title", "category", "type", "amount", "date", "paymentMethod");
            List<String> values = List.of(
                    matcher.group(1),
                    matcher.group(2),
                    matcher.group(3),
                    matcher.group(4),
                    matcher.group(5),
                    matcher.group(6)
            );
            Transaction transaction = createTransaction(headers, values, user, "PDF Import");
            if (transaction != null) {
                transactions.add(transaction);
            }
        }

        return transactions;
    }

    private boolean looksLikeHeader(List<String> cells) {
        return cells.stream()
                .map(this::normalizeKey)
                .anyMatch(key -> key.equals("title") || key.equals("amount") || key.equals("date") || key.equals("type"));
    }

    private Transaction createTransaction(List<String> headers, List<String> values, User user, String source) {
        try {
            Map<String, String> row = buildRowMap(headers, values);
            String title = value(row, values, "title", 0, "Imported Transaction");
            String titleFromStatement = firstValue(row, "description", "narration", "particulars", "details", "merchant", "memo");
            if (titleFromStatement != null) {
                title = titleFromStatement;
            }
            String amountText = findAmountText(row, values);
            BigDecimal amount = parseAmount(amountText);

            if (amount.compareTo(BigDecimal.ZERO) == 0) {
                return null;
            }

            String category = value(row, values, "category", 3, "Other");
            String paymentMethod = value(row, values, "paymentmethod", 5, source);
            Transaction.TransactionType type = parseType(row, values, amount, title, category, paymentMethod, amountText);
            amount = amount.abs();

            LocalDate date = parseDate(value(row, values, "date", 4, ""));
            String description = value(row, values, "description", 7, "Imported from " + source);
            String reference = value(row, values, "reference", -1, null);

            return Transaction.builder()
                    .title(blankToDefault(title, "Imported Transaction"))
                    .amount(amount)
                    .type(type)
                    .category(blankToDefault(category, "Other"))
                    .date(date)
                    .paymentMethod(blankToDefault(paymentMethod, source))
                    .description(blankToDefault(description, "Imported from " + source))
                    .reference(reference)
                    .recurring(false)
                    .user(user)
                    .build();
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, String> buildRowMap(List<String> headers, List<String> values) {
        Map<String, String> row = new LinkedHashMap<>();
        for (int i = 0; i < headers.size() && i < values.size(); i++) {
            row.put(normalizeKey(headers.get(i)), cleanValue(values.get(i)));
        }
        return row;
    }

    private String value(Map<String, String> row, List<String> values, String key, int index, String fallback) {
        String mapped = row.get(normalizeKey(key));
        if (mapped != null && !mapped.isBlank()) {
            return mapped;
        }
        if (index >= 0 && index < values.size() && values.get(index) != null && !values.get(index).isBlank()) {
            return cleanValue(values.get(index));
        }
        return fallback;
    }

    private String findAmountText(Map<String, String> row, List<String> values) {
        String debit = firstValue(row, "debit", "withdrawal", "withdraw", "paid", "payment", "expense", "dr", "outflow");
        if (debit != null && parseAmount(debit).compareTo(BigDecimal.ZERO) != 0) {
            return debit.trim().startsWith("-") ? debit : "-" + debit;
        }

        String credit = firstValue(row, "credit", "deposit", "received", "receipt", "income", "cr", "inflow");
        if (credit != null && parseAmount(credit).compareTo(BigDecimal.ZERO) != 0) {
            return credit;
        }

        return value(row, values, "amount", 1, "0");
    }

    private String firstValue(Map<String, String> row, String... keys) {
        for (String key : keys) {
            String mapped = row.get(normalizeKey(key));
            if (mapped != null && !mapped.isBlank()) {
                return mapped;
            }
        }
        return null;
    }

    private Transaction.TransactionType parseType(Map<String, String> row, List<String> values, BigDecimal amount,
                                                  String title, String category, String paymentMethod, String amountText) {
        String rawType = value(row, values, "type", 2, "");
        String combined = String.join(" ",
                rawType,
                value(row, values, "transactiontype", -1, ""),
                value(row, values, "drcr", -1, ""),
                value(row, values, "status", -1, ""),
                title == null ? "" : title,
                category == null ? "" : category,
                paymentMethod == null ? "" : paymentMethod,
                amountText == null ? "" : amountText
        ).toUpperCase(Locale.ROOT);

        if (firstValue(row, "debit", "withdrawal", "withdraw", "paid", "payment", "expense", "dr", "outflow") != null) {
            return Transaction.TransactionType.EXPENSE;
        }
        if (firstValue(row, "credit", "deposit", "received", "receipt", "income", "cr", "inflow") != null) {
            return Transaction.TransactionType.INCOME;
        }
        if (containsAnyKeyword(combined, EXPENSE_KEYWORDS) || combined.matches(".*\\bDR\\b.*")) {
            return Transaction.TransactionType.EXPENSE;
        }
        if (containsAnyKeyword(combined, INCOME_KEYWORDS) || combined.matches(".*\\bCR\\b.*")) {
            return Transaction.TransactionType.INCOME;
        }
        return amount.signum() < 0 ? Transaction.TransactionType.EXPENSE : Transaction.TransactionType.INCOME;
    }

    private boolean containsAnyKeyword(String value, List<String> keywords) {
        return keywords.stream().anyMatch(value::contains);
    }

    private BigDecimal parseAmount(String raw) {
        if (raw == null) {
            return BigDecimal.ZERO;
        }
        String cleaned = raw
                .replace("INR", "")
                .replace("Rs.", "")
                .replace("Rs", "")
                .replace("₹", "")
                .replace(",", "")
                .trim();
        cleaned = cleaned.replace("₹", "");
        if (cleaned.isBlank()) {
            return BigDecimal.ZERO;
        }
        boolean negative = cleaned.startsWith("(") && cleaned.endsWith(")");
        cleaned = cleaned.replace("(", "").replace(")", "");
        if (cleaned.startsWith("+")) {
            cleaned = cleaned.substring(1);
        }
        BigDecimal value = new BigDecimal(cleaned);
        if (negative) {
            return value.negate();
        }
        return value;
    }

    private List<String> parseDelimitedLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inSingleQuotes = false;
        boolean inDoubleQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\'' && !inDoubleQuotes) {
                inSingleQuotes = !inSingleQuotes;
            } else if (c == '"' && !inSingleQuotes) {
                if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inDoubleQuotes = !inDoubleQuotes;
                }
            } else if (c == ',' && !inSingleQuotes && !inDoubleQuotes) {
                values.add(cleanValue(current.toString()));
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        values.add(cleanValue(current.toString()));
        return values;
    }

    private String cleanValue(String value) {
        if (value == null) return "";
        return value.trim().replaceAll("^['\"]|['\"]$", "").trim();
    }

    private String normalizeKey(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return LocalDate.now();
        }

        DateTimeFormatter[] formatters = {
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("yyyy/MM/dd"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("MM-dd-yyyy"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy")
        };

        for (DateTimeFormatter fmt : formatters) {
            try {
                return LocalDate.parse(dateStr.trim(), fmt);
            } catch (DateTimeParseException ignored) {}
        }

        return LocalDate.now();
    }

    private TransactionDto mapToDto(Transaction t) {
        return TransactionDto.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .amount(t.getAmount())
                .type(t.getType())
                .date(t.getDate())
                .category(t.getCategory())
                .paymentMethod(t.getPaymentMethod())
                .reference(t.getReference())
                .recurring(t.isRecurring())
                .recurringPeriod(t.getRecurringPeriod())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
