package com.fintrack.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDto {

    @Data
    public static class RegisterRequest {
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @Email @NotBlank private String email;
        @NotBlank @Size(min = 8) private String password;
        private String phoneNumber;
        private String profilePicture;
        private String faceEmbedding;
    }

    @Data
    public static class LoginRequest {
        @Email @NotBlank private String email;
        @NotBlank private String password;
    }

    @Data
    public static class FaceLoginRequest {
        @NotBlank private String faceEmbedding;
    }

    @Data
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private UserDto user;

        public AuthResponse(String accessToken, String refreshToken, UserDto user) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.user = user;
        }
    }

    @Data
    public static class ForgotPasswordRequest {
        @Email @NotBlank private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank private String token;
        @NotBlank @Size(min = 8) private String newPassword;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @NotBlank @Size(min = 8) private String newPassword;
    }

    @Data
    public static class OtpRequest {
        @Email @NotBlank private String email;
    }

    @Data
    public static class OtpVerifyRequest {
        @Email @NotBlank private String email;
        @NotBlank private String otp;
    }
}
