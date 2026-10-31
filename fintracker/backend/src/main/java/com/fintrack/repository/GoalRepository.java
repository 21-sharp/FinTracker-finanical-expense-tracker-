package com.fintrack.repository;

import com.fintrack.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserIdOrderByDeadlineAsc(Long userId);
    List<Goal> findByUserIdAndStatus(Long userId, Goal.GoalStatus status);
}
