package com.fintrack.dto;

import com.fintrack.entity.Transaction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull @Positive
    private BigDecimal amount;

    @NotNull
    private Transaction.TransactionType type;

    @NotNull
    private LocalDate date;

    @NotBlank
    private String category;

    private String paymentMethod;
    private String reference;
    private boolean recurring;
    private String recurringPeriod;
    private Long accountId;
    private String accountName;
    private LocalDateTime createdAt;
}
