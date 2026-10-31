package com.fintrack.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String profilePicture;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String faceEmbedding;

    @Column(nullable = false)
    private boolean faceEnabled = false;

    @Column(nullable = false)
    private String currency = "INR";

    private String phoneNumber;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false)
    private boolean darkMode = false;

    private String resetPasswordToken;

    private LocalDateTime resetPasswordTokenExpiry;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    @Column(name = "is_online")
    private boolean isOnline = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum Role {
        USER, ADMIN, MODERATOR
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
