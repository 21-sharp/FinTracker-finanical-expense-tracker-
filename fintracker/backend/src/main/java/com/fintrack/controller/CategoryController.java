package com.fintrack.controller;

import com.fintrack.entity.Category;
import com.fintrack.entity.User;
import com.fintrack.repository.CategoryRepository;
import com.fintrack.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final SecurityUtils securityUtils;

    private Long getCurrentUserId() { 
        return securityUtils.getCurrentUserId(); 
    }

    @GetMapping
    public ResponseEntity<List<Category>> getAll(@RequestParam(required = false) Category.CategoryType type) {
        if (type != null) {
            return ResponseEntity.ok(categoryRepository.findByUserIdAndType(getCurrentUserId(), type));
        }
        return ResponseEntity.ok(categoryRepository.findByUserIdOrIsDefaultTrue(getCurrentUserId()));
    }

    @PostMapping
    public ResponseEntity<Category> create(@RequestBody Category category) {
        category.setUser(securityUtils.getCurrentUser());
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> update(@PathVariable Long id, @RequestBody Category updated) {
        Category cat = categoryRepository.findById(id).orElseThrow();
        cat.setName(updated.getName());
        cat.setType(updated.getType());
        cat.setIcon(updated.getIcon());
        cat.setColor(updated.getColor());
        cat.setDescription(updated.getDescription());
        return ResponseEntity.ok(categoryRepository.save(cat));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Category deleted"));
    }
}
