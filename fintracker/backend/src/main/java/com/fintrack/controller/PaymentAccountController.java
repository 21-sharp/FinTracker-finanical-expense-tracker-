package com.fintrack.controller;

import com.fintrack.entity.PaymentAccount;
import com.fintrack.entity.User;
import com.fintrack.repository.PaymentAccountRepository;
import com.fintrack.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payment-accounts")
@RequiredArgsConstructor
public class PaymentAccountController {

    private final PaymentAccountRepository paymentAccountRepository;
    private final SecurityUtils securityUtils;

    private Long getCurrentUserId() { 
        return securityUtils.getCurrentUserId(); 
    }

    @GetMapping
    public ResponseEntity<List<PaymentAccount>> getAll() {
        return ResponseEntity.ok(paymentAccountRepository.findByUserIdOrderByCreatedAtDesc(getCurrentUserId()));
    }

    @PostMapping
    public ResponseEntity<PaymentAccount> create(@RequestBody Map<String, Object> body) {
        User user = securityUtils.getCurrentUser();
        
        BigDecimal limit = null;
        if (body.get("creditLimit") != null) {
            limit = new BigDecimal(body.get("creditLimit").toString());
        }

        PaymentAccount account = PaymentAccount.builder()
                .name(body.get("name").toString())
                .type(PaymentAccount.AccountType.valueOf(body.get("type").toString()))
                .balance(new BigDecimal(body.get("balance").toString()))
                .creditLimit(limit)
                .user(user)
                .build();

        // Seed some initial demo accounts if needed, but here we just save the user's account
        return ResponseEntity.ok(paymentAccountRepository.save(account));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        PaymentAccount account = paymentAccountRepository.findById(id).orElseThrow();
        if (!account.getUser().getId().equals(getCurrentUserId())) {
            throw new RuntimeException("Unauthorized");
        }
        paymentAccountRepository.delete(account);
        return ResponseEntity.ok(Map.of("message", "Payment account deleted successfully"));
    }
}
