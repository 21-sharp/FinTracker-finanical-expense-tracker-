package com.fintrack.service;

import com.fintrack.dto.TransactionDto;
import com.fintrack.entity.Transaction;
import com.fintrack.entity.User;
import com.fintrack.entity.PaymentAccount;
import com.fintrack.repository.TransactionRepository;
import com.fintrack.repository.UserRepository;
import com.fintrack.repository.PaymentAccountRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.Locale;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {
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
    private final ModelMapper modelMapper;

    public TransactionDto create(TransactionDto dto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PaymentAccount account = null;
        if (dto.getAccountId() != null) {
            account = paymentAccountRepository.findById(dto.getAccountId())
                    .orElseThrow(() -> new RuntimeException("Payment account not found"));

            // Foolproof balance validations
            if (dto.getType() == Transaction.TransactionType.EXPENSE) {
                if (account.getType() != PaymentAccount.AccountType.CREDIT_CARD) {
                    if (account.getBalance().compareTo(dto.getAmount()) < 0) {
                        throw new RuntimeException("Insufficient balance in account '" + account.getName() + "'! Available balance is ₹" + account.getBalance() + ", attempted expense is ₹" + dto.getAmount() + ".");
                    }
                }
                account.setBalance(account.getBalance().subtract(dto.getAmount()));
            } else {
                account.setBalance(account.getBalance().add(dto.getAmount()));
            }
            paymentAccountRepository.save(account);
        }

        Transaction transaction = Transaction.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .type(dto.getType())
                .date(dto.getDate())
                .category(dto.getCategory())
                .paymentMethod(account != null ? account.getName() : dto.getPaymentMethod())
                .reference(dto.getReference())
                .recurring(dto.isRecurring())
                .recurringPeriod(dto.getRecurringPeriod())
                .user(user)
                .account(account)
                .build();

        transaction = transactionRepository.save(transaction);
        return mapToDto(transaction);
    }

    public TransactionDto update(Long id, TransactionDto dto, Long userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // 1. Revert old balance
        if (transaction.getAccount() != null) {
            PaymentAccount oldAccount = transaction.getAccount();
            if (transaction.getType() == Transaction.TransactionType.EXPENSE) {
                oldAccount.setBalance(oldAccount.getBalance().add(transaction.getAmount()));
            } else {
                oldAccount.setBalance(oldAccount.getBalance().subtract(transaction.getAmount()));
            }
            paymentAccountRepository.save(oldAccount);
        }

        // 2. Apply new balance
        PaymentAccount newAccount = null;
        if (dto.getAccountId() != null) {
            newAccount = paymentAccountRepository.findById(dto.getAccountId())
                    .orElseThrow(() -> new RuntimeException("Payment account not found"));

            if (dto.getType() == Transaction.TransactionType.EXPENSE) {
                if (newAccount.getType() != PaymentAccount.AccountType.CREDIT_CARD) {
                    if (newAccount.getBalance().compareTo(dto.getAmount()) < 0) {
                        // Re-apply old balance back so we don't cause an inconsistent state
                        if (transaction.getAccount() != null) {
                            PaymentAccount oldAccount = transaction.getAccount();
                            if (transaction.getType() == Transaction.TransactionType.EXPENSE) {
                                oldAccount.setBalance(oldAccount.getBalance().subtract(transaction.getAmount()));
                            } else {
                                oldAccount.setBalance(oldAccount.getBalance().add(transaction.getAmount()));
                            }
                            paymentAccountRepository.save(oldAccount);
                        }
                        throw new RuntimeException("Insufficient balance in account '" + newAccount.getName() + "'! Available balance is ₹" + newAccount.getBalance() + ", attempted expense is ₹" + dto.getAmount() + ".");
                    }
                }
                newAccount.setBalance(newAccount.getBalance().subtract(dto.getAmount()));
            } else {
                newAccount.setBalance(newAccount.getBalance().add(dto.getAmount()));
            }
            paymentAccountRepository.save(newAccount);
        }

        transaction.setTitle(dto.getTitle());
        transaction.setDescription(dto.getDescription());
        transaction.setAmount(dto.getAmount());
        transaction.setType(dto.getType());
        transaction.setDate(dto.getDate());
        transaction.setCategory(dto.getCategory());
        transaction.setPaymentMethod(newAccount != null ? newAccount.getName() : dto.getPaymentMethod());
        transaction.setReference(dto.getReference());
        transaction.setRecurring(dto.isRecurring());
        transaction.setRecurringPeriod(dto.getRecurringPeriod());
        transaction.setAccount(newAccount);

        transaction = transactionRepository.save(transaction);
        return mapToDto(transaction);
    }

    public void delete(Long id, Long userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Revert the account balance
        if (transaction.getAccount() != null) {
            PaymentAccount account = transaction.getAccount();
            if (transaction.getType() == Transaction.TransactionType.EXPENSE) {
                account.setBalance(account.getBalance().add(transaction.getAmount()));
            } else {
                account.setBalance(account.getBalance().subtract(transaction.getAmount()));
            }
            paymentAccountRepository.save(account);
        }

        transactionRepository.delete(transaction);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteAll(Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDesc(userId);
        
        for(Transaction transaction : transactions) {
            if (transaction.getAccount() != null) {
                PaymentAccount account = transaction.getAccount();
                if (transaction.getType() == Transaction.TransactionType.EXPENSE) {
                    account.setBalance(account.getBalance().add(transaction.getAmount()));
                } else {
                    account.setBalance(account.getBalance().subtract(transaction.getAmount()));
                }
                paymentAccountRepository.save(account);
            }
        }
        transactionRepository.deleteAll(transactions);
    }

    public Page<TransactionDto> getAll(Long userId, Pageable pageable) {
        reconcileImportedTransactionTypes(userId);
        return transactionRepository.findByUserIdOrderByDateDesc(userId, pageable)
                .map(this::mapToDto);
    }

    public Page<TransactionDto> search(Long userId, Transaction.TransactionType type, String category,
                                        LocalDate startDate, LocalDate endDate, String search, Pageable pageable) {
        return transactionRepository.findWithFilters(userId, type, category, startDate, endDate, search, pageable)
                .map(this::mapToDto);
    }

    public TransactionDto getById(Long id, Long userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        return mapToDto(transaction);
    }

    public List<TransactionDto> getRecentTransactions(Long userId) {
        reconcileImportedTransactionTypes(userId);
        return transactionRepository.findTop5ByUserIdOrderByDateDesc(userId)
                .stream().map(this::mapToDto).toList();
    }

    public void reconcileImportedTransactionTypes(Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDesc(userId);
        List<Transaction> changed = transactions.stream()
                .filter(this::isImportedTransaction)
                .filter(this::reclassifyIfNeeded)
                .toList();
        if (!changed.isEmpty()) {
            transactionRepository.saveAll(changed);
        }
    }

    private boolean isImportedTransaction(Transaction transaction) {
        String source = ((transaction.getPaymentMethod() == null ? "" : transaction.getPaymentMethod()) + " " +
                (transaction.getDescription() == null ? "" : transaction.getDescription())).toUpperCase(Locale.ROOT);
        return source.contains("IMPORT");
    }

    private boolean reclassifyIfNeeded(Transaction transaction) {
        String text = String.join(" ",
                transaction.getTitle() == null ? "" : transaction.getTitle(),
                transaction.getCategory() == null ? "" : transaction.getCategory(),
                transaction.getDescription() == null ? "" : transaction.getDescription()
        ).toUpperCase(Locale.ROOT);

        if (containsAnyKeyword(text, EXPENSE_KEYWORDS) && transaction.getType() != Transaction.TransactionType.EXPENSE) {
            transaction.setType(Transaction.TransactionType.EXPENSE);
            if (transaction.getCategory() == null || transaction.getCategory().isBlank() || "Other".equalsIgnoreCase(transaction.getCategory())) {
                transaction.setCategory(inferExpenseCategory(text));
            }
            return true;
        }

        if (containsAnyKeyword(text, INCOME_KEYWORDS) && transaction.getType() != Transaction.TransactionType.INCOME) {
            transaction.setType(Transaction.TransactionType.INCOME);
            return true;
        }

        return false;
    }

    private boolean containsAnyKeyword(String text, List<String> keywords) {
        return keywords.stream().anyMatch(text::contains);
    }

    private String inferExpenseCategory(String text) {
        if (text.contains("FOOD") || text.contains("GROCERY") || text.contains("RESTAURANT") || text.contains("DINING")) return "Food";
        if (text.contains("TRAVEL") || text.contains("TRANSPORT") || text.contains("FUEL") || text.contains("PETROL") || text.contains("DIESEL")) return "Travel";
        if (text.contains("SHOPPING") || text.contains("PURCHASE")) return "Shopping";
        if (text.contains("BILL") || text.contains("ELECTRICITY") || text.contains("WATER") || text.contains("INTERNET") || text.contains("PHONE")) return "Bills";
        if (text.contains("ENTERTAINMENT") || text.contains("MOVIE")) return "Entertainment";
        if (text.contains("HEALTHCARE") || text.contains("MEDICAL") || text.contains("DOCTOR") || text.contains("MEDICINE")) return "Healthcare";
        if (text.contains("EMI") || text.contains("LOAN") || text.contains("MORTGAGE")) return "EMI";
        return "Other";
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

    public ByteArrayInputStream exportToExcel(Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDesc(userId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Transactions");

            // Define header style
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.BLUE_GREY.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            // Row for headers
            Row headerRow = sheet.createRow(0);
            String[] columns = {"ID", "Title", "Category", "Type", "Amount", "Date", "Payment Method", "Description"};
            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

            // Formatting styles
            CellStyle incomeStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font incomeFont = workbook.createFont();
            incomeFont.setColor(IndexedColors.GREEN.getIndex());
            incomeStyle.setFont(incomeFont);

            CellStyle expenseStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font expenseFont = workbook.createFont();
            expenseFont.setColor(IndexedColors.RED.getIndex());
            expenseStyle.setFont(expenseFont);

            int rowIdx = 1;
            for (Transaction t : transactions) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(t.getId());
                row.createCell(1).setCellValue(t.getTitle());
                row.createCell(2).setCellValue(t.getCategory());
                row.createCell(3).setCellValue(t.getType().name());

                Cell amountCell = row.createCell(4);
                amountCell.setCellValue(t.getAmount().doubleValue());
                if (t.getType() == Transaction.TransactionType.INCOME) {
                    amountCell.setCellStyle(incomeStyle);
                } else {
                    amountCell.setCellStyle(expenseStyle);
                }

                row.createCell(5).setCellValue(t.getDate().toString());
                row.createCell(6).setCellValue(t.getPaymentMethod());
                row.createCell(7).setCellValue(t.getDescription() != null ? t.getDescription() : "");
            }

            for (int col = 0; col < columns.length; col++) {
                sheet.autoSizeColumn(col);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Failed to export Excel: " + e.getMessage(), e);
        }
    }

    public ByteArrayInputStream exportToPdf(Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDesc(userId);
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Add Header
            com.itextpdf.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLUE);
            Paragraph title = new Paragraph("FinTrack Pro - Transaction Statement", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Add Meta info
            com.itextpdf.text.Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.GRAY);
            Paragraph meta = new Paragraph("Generated on: " + LocalDate.now().toString(), metaFont);
            meta.setAlignment(Element.ALIGN_RIGHT);
            meta.setSpacingAfter(20);
            document.add(meta);

            // Add Table
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 2f, 1.5f, 2f, 2f, 2.5f});

            com.itextpdf.text.Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);

            String[] headers = {"Title", "Category", "Type", "Amount", "Date", "Method"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBackgroundColor(BaseColor.DARK_GRAY);
                cell.setPadding(6);
                table.addCell(cell);
            }

            com.itextpdf.text.Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.BLACK);
            com.itextpdf.text.Font incomeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new BaseColor(16, 185, 129));
            com.itextpdf.text.Font expenseFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new BaseColor(239, 68, 68));

            for (Transaction t : transactions) {
                PdfPCell cell;

                table.addCell(new PdfPCell(new Phrase(t.getTitle(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(t.getCategory(), cellFont)));

                cell = new PdfPCell(new Phrase(t.getType().name(), cellFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);

                String amtText = (t.getType() == Transaction.TransactionType.INCOME ? "+" : "-") + "INR " + t.getAmount().toString();
                cell = new PdfPCell(new Phrase(amtText, t.getType() == Transaction.TransactionType.INCOME ? incomeFont : expenseFont));
                cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(cell);

                cell = new PdfPCell(new Phrase(t.getDate().toString(), cellFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);

                table.addCell(new PdfPCell(new Phrase(t.getPaymentMethod(), cellFont)));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export PDF: " + e.getMessage(), e);
        }

        return new ByteArrayInputStream(out.toByteArray());
    }
}
