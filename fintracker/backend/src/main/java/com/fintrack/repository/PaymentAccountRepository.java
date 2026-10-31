package com.fintrack.repository;

import com.fintrack.entity.PaymentAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentAccountRepository extends JpaRepository<PaymentAccount, Long> {
    List<PaymentAccount> findByUserIdOrderByCreatedAtDesc(Long userId);
}
