package com.fintrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDto {
    private BigDecimal totalBalance;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpenses;
    private BigDecimal monthlySavings;
    private BigDecimal savingsRate;
    private List<TransactionDto> recentTransactions;
    private List<CategoryExpenseDto> expenseByCategory;
    private List<MonthlyTrendDto> monthlyTrend;
    private long unreadNotifications;
    private FinancialHealthDto financialHealth;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CategoryExpenseDto {
        private String category;
        private BigDecimal amount;
        private double percentage;
        private String color;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthlyTrendDto {
        private String month;
        private BigDecimal income;
        private BigDecimal expense;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FinancialHealthDto {
        private int score;
        private String status;
        private String message;
    }
}
