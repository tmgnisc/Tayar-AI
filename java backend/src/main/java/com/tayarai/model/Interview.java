package com.tayarai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Data
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String role;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewDifficulty difficulty;
    
    @Column(nullable = false, length = 50)
    private String language;
    
    @Column(name = "overall_score", precision = 4, scale = 2)
    private BigDecimal overallScore;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewStatus status = InterviewStatus.IN_PROGRESS;
    
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes;
    
    @Column(name = "vapi_call_id")
    private String vapiCallId;
    
    @Column(name = "vapi_assistant_id")
    private String vapiAssistantId;
    
    @Column(name = "vapi_recording_url", columnDefinition = "TEXT")
    private String vapiRecordingUrl;
    
    @Column(name = "conversation_transcript", columnDefinition = "TEXT")
    private String conversationTranscript;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum InterviewDifficulty {
        BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    }
    
    public enum InterviewStatus {
        IN_PROGRESS, COMPLETED, CANCELLED
    }
}

