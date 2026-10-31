package com.fintrack.dto;

import com.fintrack.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private User.Role role;
    private String profilePicture;
    private boolean faceEnabled;
    private String currency;
    private String phoneNumber;
    private boolean darkMode;
    private LocalDateTime createdAt;
    private LocalDateTime lastActiveAt;
    private boolean isOnline;
}
