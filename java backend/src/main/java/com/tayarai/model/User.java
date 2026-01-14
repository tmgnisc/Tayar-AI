package com.tayarai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "domain_id")
    private Domain domain;
    
    @Enumerated(EnumType.STRING)
    private UserLevel level;
    
    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;
    
    @Column(name = "password_reset_otp", length = 6)
    private String passwordResetOtp;
    
    @Column(name = "password_reset_otp_expiry")
    private LocalDateTime passwordResetOtpExpiry;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_type")
    private SubscriptionType subscriptionType = SubscriptionType.FREE;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_status")
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.ACTIVE;
    
    @Column(name = "subscription_start_date")
    private LocalDate subscriptionStartDate;
    
    @Column(name = "subscription_end_date")
    private LocalDate subscriptionEndDate;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "last_login")
    private LocalDateTime lastLogin;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum UserRole {
        USER, ADMIN
    }
    
    public enum UserLevel {
        BEGINNER, INTERMEDIATE, SENIOR, PRINCIPAL, LEAD
    }
    
    public enum SubscriptionType {
        FREE, PRO, ENTERPRISE
    }
    
    public enum SubscriptionStatus {
        ACTIVE, CANCELLED, EXPIRED
    }
}

