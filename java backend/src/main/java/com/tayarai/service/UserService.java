package com.tayarai.service;

import com.tayarai.model.User;
import com.tayarai.repository.UserRepository;
import com.tayarai.repository.InterviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private InterviewRepository interviewRepository;
    
    public Map<String, Object> getDashboardData(Integer userId) {
        Map<String, Object> dashboard = new HashMap<>();
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Interview stats
        Long totalInterviews = interviewRepository.countCompletedInterviewsByUserId(userId);
        
        // Today's interview count (for free user daily limit)
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime tomorrow = today.plusDays(1);
        Long todayInterviews = interviewRepository.countInterviewsByUserIdAndDateRange(userId, today, tomorrow);
        
        // Check if free user has reached daily limit
        boolean isFreeUser = user.getSubscriptionType() == User.SubscriptionType.FREE;
        boolean dailyLimitReached = isFreeUser && todayInterviews >= 1;
        
        dashboard.put("totalInterviews", totalInterviews);
        dashboard.put("todayInterviews", todayInterviews);
        dashboard.put("dailyLimit", Map.of(
            "reached", dailyLimitReached,
            "remaining", isFreeUser ? Math.max(0, 1 - todayInterviews) : -1,
            "maxInterviews", isFreeUser ? 1 : -1
        ));
        dashboard.put("subscriptionType", user.getSubscriptionType());
        dashboard.put("subscriptionStatus", user.getSubscriptionStatus());
        
        return dashboard;
    }
}

