package com.fintrack.repository;

import com.fintrack.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserIdOrIsDefaultTrue(Long userId);
    List<Category> findByUserIdAndType(Long userId, Category.CategoryType type);
    List<Category> findByIsDefaultTrue();
}
