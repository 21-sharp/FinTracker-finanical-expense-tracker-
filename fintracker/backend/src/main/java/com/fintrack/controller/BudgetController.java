package com.fintrack.controller;

import com.fintrack.entity.Budget;
import com.fintrack.entity.User;
import com.fintrack.repository.BudgetRepository;
import com.fintrack.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetRepository budgetRepository;
    private final SecurityUtils securityUtils;

    private Long getCurrentUserId() { 
        return securityUtils.getCurrentUserId(); 
    }

    @GetMapping
    public ResponseEntity<List<Budget>> getAll(@RequestParam(required = false) Integer month,
                                               @RequestParam(required = false) Integer year) {
        if (month != null && year != null) {
            return ResponseEntity.ok(budgetRepository.findByUserIdAndMonthAndYear(getCurrentUserId(), month, year));
        }
        return ResponseEntity.ok(budgetRepository.findByUserId(getCurrentUserId()));
    }

    @PostMapping
    public ResponseEntity<Budget> create(@RequestBody Budget budget) {
        budget.setUser(securityUtils.getCurrentUser());
        return ResponseEntity.ok(budgetRepository.save(budget));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Budget> update(@PathVariable Long id, @RequestBody Budget updated) {
        Budget budget = budgetRepository.findById(id).orElseThrow();
        budget.setName(updated.getName());
        budget.setCategory(updated.getCategory());
        budget.setBudgetAmount(updated.getBudgetAmount());
        budget.setSpentAmount(updated.getSpentAmount());
        budget.setColor(updated.getColor());
        budget.setIcon(updated.getIcon());
        return ResponseEntity.ok(budgetRepository.save(budget));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        budgetRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Budget deleted"));
    }
}
