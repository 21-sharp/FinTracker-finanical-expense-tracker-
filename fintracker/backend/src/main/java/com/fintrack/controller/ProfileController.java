package com.fintrack.controller;

import com.fintrack.dto.AuthDto;
import com.fintrack.dto.UserDto;
import com.fintrack.entity.User;
import com.fintrack.repository.UserRepository;
import com.fintrack.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final PasswordEncoder passwordEncoder;
    private final com.fintrack.service.AuthService authService;

    @GetMapping
    public ResponseEntity<UserDto> getProfile() {
        User user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(mapToDto(user));
    }

    @PutMapping
    public ResponseEntity<UserDto> updateProfile(@RequestBody Map<String, String> body) {
        User user = securityUtils.getCurrentUser();

        if (body.containsKey("firstName")) user.setFirstName(body.get("firstName"));
        if (body.containsKey("lastName")) user.setLastName(body.get("lastName"));
        if (body.containsKey("phoneNumber")) user.setPhoneNumber(body.get("phoneNumber"));
        if (body.containsKey("currency")) user.setCurrency(body.get("currency"));

        userRepository.save(user);
        return ResponseEntity.ok(mapToDto(user));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody AuthDto.ChangePasswordRequest request) {
        User user = securityUtils.getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect.");
        }

        if (request.getNewPassword().length() < 8) {
            throw new RuntimeException("New password must be at least 8 characters.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/face")
    public ResponseEntity<UserDto> updateFace(@RequestBody Map<String, String> body) {
        User user = securityUtils.getCurrentUser();
        String profilePicture = body.get("profilePicture");
        String faceEmbedding = body.get("faceEmbedding");
        return ResponseEntity.ok(authService.updateFaceProfile(user, profilePicture, faceEmbedding));
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .profilePicture(user.getProfilePicture())
                .faceEnabled(user.isFaceEnabled())
                .currency(user.getCurrency())
                .phoneNumber(user.getPhoneNumber())
                .darkMode(user.isDarkMode())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
