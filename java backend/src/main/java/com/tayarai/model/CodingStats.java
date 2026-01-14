package com.tayarai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "coding_stats")
@Data
public class CodingStats {
    @Id
    @Column(name = "user_id")
    private Integer userId;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
    
    @Column(name = "total_submissions")
    private Integer totalSubmissions = 0;
    
    @Column(name = "accepted_submissions")
    private Integer acceptedSubmissions = 0;
    
    @Column(name = "easy_solved")
    private Integer easySolved = 0;
    
    @Column(name = "medium_solved")
    private Integer mediumSolved = 0;
    
    @Column(name = "hard_solved")
    private Integer hardSolved = 0;
    
    @Column(name = "favorite_language", length = 50)
    private String favoriteLanguage;
    
    @Column(name = "total_execution_time", precision = 10, scale = 2)
    private BigDecimal totalExecutionTime = BigDecimal.ZERO;
    
    @Column(name = "streak_days")
    private Integer streakDays = 0;
    
    @Column(name = "last_submission_date")
    private LocalDate lastSubmissionDate;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

