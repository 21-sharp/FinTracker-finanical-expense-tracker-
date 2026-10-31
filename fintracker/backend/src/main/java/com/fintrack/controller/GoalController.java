package com.fintrack.controller;

import com.fintrack.entity.Goal;
import com.fintrack.entity.User;
import com.fintrack.repository.GoalRepository;
import com.fintrack.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalRepository goalRepository;
    private final SecurityUtils securityUtils;

    private Long getCurrentUserId() { 
        return securityUtils.getCurrentUserId(); 
    }

    @GetMapping
    public ResponseEntity<List<Goal>> getAll() {
        Long userId = getCurrentUserId();
        List<Goal> goals = goalRepository.findByUserIdOrderByDeadlineAsc(userId);
        if (goals.isEmpty()) {
            goals = createDefaultGoals(securityUtils.getCurrentUser());
        }
        return ResponseEntity.ok(goals);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Goal goal) {
        if (goal.getDeadline() != null && goal.getDeadline().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Target date cannot be in the past."));
        }
        goal.setUser(securityUtils.getCurrentUser());
        return ResponseEntity.ok(goalRepository.save(goal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Goal updated) {
        if (updated.getDeadline() != null && updated.getDeadline().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Target date cannot be in the past."));
        }
        Goal goal = goalRepository.findById(id).orElseThrow();
        goal.setName(updated.getName());
        goal.setDescription(updated.getDescription());
        goal.setTargetAmount(updated.getTargetAmount());
        goal.setSavedAmount(updated.getSavedAmount());
        goal.setDeadline(updated.getDeadline());
        goal.setIcon(updated.getIcon());
        goal.setColor(updated.getColor());
        goal.setStatus(updated.getStatus());
        return ResponseEntity.ok(goalRepository.save(goal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        goalRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Goal deleted"));
    }

    private List<Goal> createDefaultGoals(User user) {
        LocalDate today = LocalDate.now();
        List<Goal> defaults = new ArrayList<>();
        defaults.add(defaultGoal("Emergency Fund", "Build a safety cushion for unexpected expenses.", "fas fa-shield-halved", "#10B981", 50000, today.plusMonths(6), user));
        defaults.add(defaultGoal("New Vehicle", "Save toward a down payment or purchase.", "fas fa-car", "#3B82F6", 150000, today.plusMonths(12), user));
        defaults.add(defaultGoal("Vacation Plan", "Set aside money for travel and experiences.", "fas fa-plane", "#F59E0B", 75000, today.plusMonths(9), user));
        return goalRepository.saveAll(defaults);
    }

    private Goal defaultGoal(String name, String description, String icon, String color, int targetAmount, LocalDate deadline, User user) {
        return Goal.builder()
                .name(name)
                .description(description)
                .targetAmount(BigDecimal.valueOf(targetAmount))
                .savedAmount(BigDecimal.ZERO)
                .deadline(deadline)
                .icon(icon)
                .color(color)
                .status(Goal.GoalStatus.IN_PROGRESS)
                .user(user)
                .build();
    }
}
