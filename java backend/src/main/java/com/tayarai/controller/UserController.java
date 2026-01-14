package com.tayarai.controller;

import com.tayarai.model.User;
import com.tayarai.repository.UserRepository;
import com.tayarai.repository.InterviewRepository;
import com.tayarai.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private InterviewRepository interviewRepository;
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(Authentication authentication) {
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            return ResponseEntity.ok(userService.getDashboardData(userId));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching dashboard: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("name", user.getName());
            profile.put("email", user.getEmail());
            profile.put("role", user.getRole());
            profile.put("avatarUrl", user.getAvatarUrl());
            profile.put("subscriptionType", user.getSubscriptionType());
            profile.put("subscriptionStatus", user.getSubscriptionStatus());
            
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching profile: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}

