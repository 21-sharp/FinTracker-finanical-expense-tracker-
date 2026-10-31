package com.fintrack.repository;

import com.fintrack.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Page<Transaction> findByUserIdOrderByDateDesc(Long userId, Pageable pageable);

    List<Transaction> findByUserIdAndTypeOrderByDateDesc(Long userId, Transaction.TransactionType type);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
           "AND (:type IS NULL OR t.type = :type) " +
           "AND (:category IS NULL OR t.category = :category) " +
           "AND (:startDate IS NULL OR t.date >= :startDate) " +
           "AND (:endDate IS NULL OR t.date <= :endDate) " +
           "AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Transaction> findWithFilters(
            @Param("userId") Long userId,
            @Param("type") Transaction.TransactionType type,
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type AND MONTH(t.date) = :month AND YEAR(t.date) = :year")
    BigDecimal sumByUserIdAndTypeAndMonthAndYear(
            @Param("userId") Long userId,
            @Param("type") Transaction.TransactionType type,
            @Param("month") int month,
            @Param("year") int year
    );

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type")
    BigDecimal sumByUserIdAndType(@Param("userId") Long userId, @Param("type") Transaction.TransactionType type);

    @Query("SELECT t.category, SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.type = 'EXPENSE' AND MONTH(t.date) = :month AND YEAR(t.date) = :year GROUP BY t.category")
    List<Object[]> getExpenseByCategory(@Param("userId") Long userId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT t.category, SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.type = 'EXPENSE' GROUP BY t.category")
    List<Object[]> getExpenseByCategory(@Param("userId") Long userId);

    @Query("SELECT MONTH(t.date) as month, SUM(CASE WHEN t.type='INCOME' THEN t.amount ELSE 0 END) as income, SUM(CASE WHEN t.type='EXPENSE' THEN t.amount ELSE 0 END) as expense FROM Transaction t WHERE t.user.id = :userId AND YEAR(t.date) = :year GROUP BY MONTH(t.date) ORDER BY MONTH(t.date)")
    List<Object[]> getMonthlyIncomeVsExpense(@Param("userId") Long userId, @Param("year") int year);

    List<Transaction> findTop5ByUserIdOrderByDateDesc(Long userId);

    List<Transaction> findByUserIdOrderByDateDesc(Long userId);

    @Query("SELECT t FROM Transaction t JOIN FETCH t.user ORDER BY t.date DESC")
    List<Transaction> findAllWithUserOrderByDateDesc();

    boolean existsByUserIdAndTitleAndAmountAndTypeAndDate(Long userId, String title, java.math.BigDecimal amount, Transaction.TransactionType type, java.time.LocalDate date);
}
