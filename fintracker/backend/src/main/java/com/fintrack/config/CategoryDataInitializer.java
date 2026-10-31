package com.fintrack.config;

import com.fintrack.entity.Category;
import com.fintrack.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CategoryDataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            List<Category> defaultCategories = List.of(
                    Category.builder().name("Salary").type(Category.CategoryType.INCOME).icon("fas fa-building").color("#10B981").isDefault(true).build(),
                    Category.builder().name("Freelancing").type(Category.CategoryType.INCOME).icon("fas fa-laptop-code").color("#2563EB").isDefault(true).build(),
                    Category.builder().name("Investments").type(Category.CategoryType.INCOME).icon("fas fa-chart-line").color("#8B5CF6").isDefault(true).build(),
                    Category.builder().name("Food & Dining").type(Category.CategoryType.EXPENSE).icon("fas fa-utensils").color("#2563EB").isDefault(true).build(),
                    Category.builder().name("Travel").type(Category.CategoryType.EXPENSE).icon("fas fa-plane").color("#10B981").isDefault(true).build(),
                    Category.builder().name("Shopping").type(Category.CategoryType.EXPENSE).icon("fas fa-shopping-bag").color("#F59E0B").isDefault(true).build(),
                    Category.builder().name("Bills & Utilities").type(Category.CategoryType.EXPENSE).icon("fas fa-file-invoice").color("#8B5CF6").isDefault(true).build(),
                    Category.builder().name("Entertainment").type(Category.CategoryType.EXPENSE).icon("fas fa-film").color("#EC4899").isDefault(true).build(),
                    Category.builder().name("Healthcare").type(Category.CategoryType.EXPENSE).icon("fas fa-heartbeat").color("#06B6D4").isDefault(true).build(),
                    Category.builder().name("EMI").type(Category.CategoryType.EXPENSE).icon("fas fa-car").color("#EF4444").isDefault(true).build()
            );
            categoryRepository.saveAll(defaultCategories);
        }
    }
}
