package com.tayarai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "user_cvs")
@Data
public class UserCv {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(length = 50)
    private String template = "modern";
    
    @Column(name = "personal_info", nullable = false, columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode personalInfo;
    
    @Column(columnDefinition = "TEXT")
    private String summary;
    
    @Column(columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode experience;
    
    @Column(columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode education;
    
    @Column(columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode skills;
    
    @Column(columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode projects;
    
    @Column(columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode certifications;
    
    @Column(columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode languages;
    
    @Column(name = "is_public")
    private Boolean isPublic = false;
    
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

