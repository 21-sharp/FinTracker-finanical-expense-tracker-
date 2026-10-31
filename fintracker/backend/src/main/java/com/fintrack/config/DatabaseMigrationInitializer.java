package com.fintrack.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Order(1) // Run before other initializers to ensure columns are migrated first
public class DatabaseMigrationInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationInitializer.class);
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Running automatic database migration check for face login and profile picture columns...");

        // Ensure profile_picture is LONGTEXT in MySQL
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN profile_picture LONGTEXT");
            log.info("Successfully ensured users.profile_picture is LONGTEXT.");
        } catch (Exception e) {
            log.warn("Note: Column users.profile_picture could not be altered (might already be LONGTEXT, or not using MySQL): {}", e.getMessage());
        }

        // Ensure face_embedding is LONGTEXT in MySQL
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN face_embedding LONGTEXT");
            log.info("Successfully ensured users.face_embedding is LONGTEXT.");
        } catch (Exception e) {
            log.warn("Note: Column users.face_embedding could not be altered: {}", e.getMessage());
        }

        // Ensure face_enabled is BOOLEAN and has default value
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN face_enabled BOOLEAN DEFAULT FALSE");
            log.info("Successfully ensured users.face_enabled is BOOLEAN with DEFAULT FALSE.");
        } catch (Exception e) {
            log.warn("Note: Column users.face_enabled could not be altered: {}", e.getMessage());
        }
    }
}
