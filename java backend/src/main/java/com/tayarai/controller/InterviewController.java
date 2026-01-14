package com.tayarai.controller;

import com.tayarai.model.Interview;
import com.tayarai.model.User;
import com.tayarai.repository.InterviewRepository;
import com.tayarai.repository.UserRepository;
import com.tayarai.service.InterviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user/interviews")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class InterviewController {
    
    @Autowired
    private InterviewRepository interviewRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private InterviewService interviewService;
    
    @PostMapping
    public ResponseEntity<?> createInterview(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Check daily limit for free users
            if (user.getSubscriptionType() == User.SubscriptionType.FREE) {
                LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
                LocalDateTime tomorrow = today.plusDays(1);
                Long todayInterviews = interviewRepository.countInterviewsByUserIdAndDateRange(
                    userId, today, tomorrow);
                
                if (todayInterviews >= 1) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Daily interview limit reached. Upgrade to Pro for unlimited interviews.");
                    return ResponseEntity.status(403).body(error);
                }
            }
            
            Interview interview = new Interview();
            interview.setUser(user);
            interview.setRole(request.get("role"));
            interview.setDifficulty(Interview.InterviewDifficulty.valueOf(
                request.get("difficulty").toUpperCase()));
            interview.setLanguage(request.get("language"));
            interview.setStatus(Interview.InterviewStatus.IN_PROGRESS);
            
            interview = interviewRepository.save(interview);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", interview.getId());
            response.put("message", "Interview started");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error creating interview: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getInterview(@PathVariable Integer id, Authentication authentication) {
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found"));
            
            if (!interview.getUser().getId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", interview.getId());
            response.put("role", interview.getRole());
            response.put("difficulty", interview.getDifficulty());
            response.put("status", interview.getStatus());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }
}

