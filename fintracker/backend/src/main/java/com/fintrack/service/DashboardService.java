package com.fintrack.service;

import com.fintrack.dto.DashboardDto;
import com.fintrack.dto.TransactionDto;
import com.fintrack.entity.Transaction;
import com.fintrack.repository.NotificationRepository;
import com.fintrack.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final NotificationRepository notificationRepository;

    private static final String[] CATEGORY_COLORS = {
        "#2563EB", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6",
        "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
    };

    public DashboardDto getDashboardData(Long userId, Integer requestedYear) {
        transactionService.reconcileImportedTransactionTypes(userId);

        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = (requestedYear != null) ? requestedYear : now.getYear();

        BigDecimal monthlyIncome = transactionRepository.sumByUserIdAndType(userId, Transaction.TransactionType.INCOME);
        if (monthlyIncome == null) monthlyIncome = BigDecimal.ZERO;
        
        BigDecimal monthlyExpense = transactionRepository.sumByUserIdAndType(userId, Transaction.TransactionType.EXPENSE);
        if (monthlyExpense == null) monthlyExpense = BigDecimal.ZERO;

        BigDecimal totalBalance = monthlyIncome.subtract(monthlyExpense);
        BigDecimal savingsRate = monthlyIncome.compareTo(BigDecimal.ZERO) > 0
                ? totalBalance.multiply(BigDecimal.valueOf(100)).divide(monthlyIncome, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Expense by category
        List<Object[]> categoryData = transactionRepository.getExpenseByCategory(userId);
        List<DashboardDto.CategoryExpenseDto> expenseByCategory = new ArrayList<>();
        int colorIndex = 0;
        for (Object[] row : categoryData) {
            BigDecimal amount = toBigDecimal(row[1]);
            double pct = monthlyExpense.compareTo(BigDecimal.ZERO) > 0
                    ? amount.multiply(BigDecimal.valueOf(100)).divide(monthlyExpense, 2, RoundingMode.HALF_UP).doubleValue()
                    : 0;
            expenseByCategory.add(DashboardDto.CategoryExpenseDto.builder()
                    .category((String) row[0])
                    .amount(amount)
                    .percentage(pct)
                    .color(CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length])
                    .build());
            colorIndex++;
        }

        // Monthly trend
        List<Object[]> trendData = transactionRepository.getMonthlyIncomeVsExpense(userId, year);
        List<DashboardDto.MonthlyTrendDto> monthlyTrend = new ArrayList<>();
        for (Object[] row : trendData) {
            monthlyTrend.add(DashboardDto.MonthlyTrendDto.builder()
                    .month(Month.of(((Number) row[0]).intValue()).name().substring(0, 3))
                    .income(toBigDecimal(row[1]))
                    .expense(toBigDecimal(row[2]))
                    .build());
        }

        // Recent transactions
        List<TransactionDto> recentTransactions = transactionService.getRecentTransactions(userId);

        // Unread notifications
        long unreadNotifications = notificationRepository.countByUserIdAndIsReadFalse(userId);

        // Financial health score
        DashboardDto.FinancialHealthDto healthDto = calculateFinancialHealth(monthlyIncome, monthlyExpense, savingsRate);

        return DashboardDto.builder()
                .totalBalance(totalBalance)
                .monthlyIncome(monthlyIncome)
                .monthlyExpenses(monthlyExpense)
                .monthlySavings(totalBalance)
                .savingsRate(savingsRate)
                .recentTransactions(recentTransactions)
                .expenseByCategory(expenseByCategory)
                .monthlyTrend(monthlyTrend)
                .unreadNotifications(unreadNotifications)
                .financialHealth(healthDto)
                .build();
    }

    private DashboardDto.FinancialHealthDto calculateFinancialHealth(BigDecimal income, BigDecimal expense, BigDecimal savingsRate) {
        int score = 50;
        if (savingsRate.compareTo(BigDecimal.valueOf(30)) >= 0) score = 90;
        else if (savingsRate.compareTo(BigDecimal.valueOf(20)) >= 0) score = 75;
        else if (savingsRate.compareTo(BigDecimal.valueOf(10)) >= 0) score = 60;
        else if (savingsRate.compareTo(BigDecimal.ZERO) > 0) score = 45;
        else score = 25;

        String status = score >= 75 ? "Excellent" : score >= 50 ? "Good" : score >= 30 ? "Fair" : "Needs Attention";
        String message = score >= 75 ? "Your finances are in great shape!" :
                         score >= 50 ? "You're doing well, but there's room for improvement." :
                         "Consider reducing expenses and increasing savings.";

        return DashboardDto.FinancialHealthDto.builder()
                .score(score).status(status).message(message).build();
     }

     private BigDecimal toBigDecimal(Object val) {
         if (val == null) return BigDecimal.ZERO;
         if (val instanceof BigDecimal) return (BigDecimal) val;
         if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
         return BigDecimal.ZERO;
     }
}
