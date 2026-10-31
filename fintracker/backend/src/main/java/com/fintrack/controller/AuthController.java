package com.fintrack.controller;

import com.fintrack.dto.AuthDto;
import com.fintrack.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.fintrack.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/face-login")
    public ResponseEntity<AuthDto.AuthResponse> faceLogin(@Valid @RequestBody AuthDto.FaceLoginRequest request) {
        return ResponseEntity.ok(authService.faceLogin(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody AuthDto.ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Password reset link sent to your email"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody AuthDto.ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully"));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(@Valid @RequestBody AuthDto.OtpRequest request) {
        return ResponseEntity.ok(otpService.sendOtp(request.getEmail()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody AuthDto.OtpVerifyRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestBody Map<String, String> request) {
        authService.logout(request.get("email"));
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/admin/logins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getLoginHistory() {
        return ResponseEntity.ok(authService.getLoginHistory());
    }

    @GetMapping("/admin/expenses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllExpensesForAdmin() {
        return ResponseEntity.ok(authService.getAllExpensesForAdmin());
    }
}
