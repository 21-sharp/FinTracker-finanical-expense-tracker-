package com.fintrack.config;

import com.fintrack.entity.User;
import com.fintrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@fintrack.com")) {
            userRepository.save(User.builder()
                    .firstName("Admin")
                    .lastName("User")
                    .email("admin@fintrack.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(User.Role.ADMIN)
                    .enabled(true)
                    .currency("INR")
                    .darkMode(false)
                    .build());
        }
    }
}
