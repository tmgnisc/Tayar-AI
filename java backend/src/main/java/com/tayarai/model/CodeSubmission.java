package com.tayarai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "code_submissions")
@Data
public class CodeSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "challenge_id")
    private Integer challengeId;
    
    @Column(nullable = false, length = 50)
    private String language;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status = SubmissionStatus.PENDING;
    
    @Column(name = "execution_time", precision = 10, scale = 3)
    private BigDecimal executionTime;
    
    @Column(name = "memory_used", precision = 10, scale = 2)
    private BigDecimal memoryUsed;
    
    @Column(columnDefinition = "TEXT")
    private String output;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum SubmissionStatus {
        PENDING, RUNNING, SUCCESS, ERROR, TIMEOUT
    }
}

