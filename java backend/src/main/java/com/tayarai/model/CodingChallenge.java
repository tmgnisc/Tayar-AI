package com.tayarai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "coding_challenges")
@Data
public class CodingChallenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false, unique = true)
    private String slug;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChallengeDifficulty difficulty = ChallengeDifficulty.EASY;
    
    @Column(length = 100)
    private String category;
    
    @Column(columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode tags;
    
    @Column(name = "starter_code", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode starterCode;
    
    @Column(name = "test_cases", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode testCases;
    
    @Column(columnDefinition = "TEXT")
    private String constraints;
    
    @Column(name = "time_limit")
    private Integer timeLimit = 5;
    
    @Column(name = "memory_limit")
    private Integer memoryLimit = 128;
    
    @Column(name = "difficulty_score")
    private Integer difficultyScore = 1;
    
    @Column(name = "acceptance_rate", precision = 5, scale = 2)
    private BigDecimal acceptanceRate = BigDecimal.ZERO;
    
    @Column(name = "total_attempts")
    private Integer totalAttempts = 0;
    
    @Column(name = "total_accepted")
    private Integer totalAccepted = 0;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
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
    
    public enum ChallengeDifficulty {
        EASY, MEDIUM, HARD
    }
}

