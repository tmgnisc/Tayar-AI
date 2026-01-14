package com.tayarai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "code_snippets")
@Data
public class CodeSnippet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(length = 255)
    private String title;
    
    @Column(nullable = false, length = 50)
    private String language;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;
    
    @Column(name = "is_public")
    private Boolean isPublic = false;
    
    @Column(columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode tags;
    
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

