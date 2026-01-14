package com.tayarai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.util.*;

@Service
public class InterviewService {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private Map<String, Map<String, List<Map<String, Object>>>> questionsCache = new HashMap<>();
    
    // Profanity words
    private static final List<String> PROFANITY_WORDS = Arrays.asList(
        "fuck", "shit", "damn", "hell", "bitch", "ass", "bastard", "crap",
        "stupid", "idiot", "dumb", "moron", "retard", "piss"
    );
    
    // Abusive phrases
    private static final List<String> ABUSIVE_PHRASES = Arrays.asList(
        "i am angry", "you are bad", "you are stupid", "you are dumb",
        "you are wrong", "this is bad", "this is stupid", "this is dumb",
        "i hate", "i am frustrated", "this is terrible"
    );
    
    // Low knowledge phrases
    private static final List<String> LOW_KNOWLEDGE_PHRASES = Arrays.asList(
        "i don't know", "i don't know that", "i have no idea",
        "i'm not sure", "i'm not familiar", "i haven't learned",
        "i don't understand", "i can't answer"
    );
    
    public Map<String, Object> getQuestions(String domain, String level) {
        try {
            if (questionsCache.isEmpty()) {
                loadQuestions();
            }
            
            String domainLower = domain.toLowerCase();
            String levelLower = level.toLowerCase();
            
            if (questionsCache.containsKey(domainLower) && 
                questionsCache.get(domainLower).containsKey(levelLower)) {
                List<Map<String, Object>> questions = questionsCache.get(domainLower).get(levelLower);
                return Map.of("questions", questions);
            }
            
            return Map.of("questions", Collections.emptyList());
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("questions", Collections.emptyList());
        }
    }
    
    public List<Map<String, Object>> getShuffledQuestions(String domain, String level, int count) {
        Map<String, Object> questionsData = getQuestions(domain, level);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> allQuestions = (List<Map<String, Object>>) questionsData.get("questions");
        
        if (allQuestions == null || allQuestions.isEmpty()) {
            return Collections.emptyList();
        }
        
        Collections.shuffle(allQuestions);
        return allQuestions.subList(0, Math.min(count, allQuestions.size()));
    }
    
    public boolean checkProfanity(String answer) {
        String lowerAnswer = answer.toLowerCase();
        return PROFANITY_WORDS.stream().anyMatch(lowerAnswer::contains) ||
               ABUSIVE_PHRASES.stream().anyMatch(lowerAnswer::contains);
    }
    
    public boolean checkLowKnowledge(String answer) {
        String lowerAnswer = answer.toLowerCase();
        return LOW_KNOWLEDGE_PHRASES.stream().anyMatch(lowerAnswer::contains);
    }
    
    public boolean checkOffTopic(String answer, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) {
            return false;
        }
        
        String lowerAnswer = answer.toLowerCase();
        
        // Check for abusive phrases first
        if (ABUSIVE_PHRASES.stream().anyMatch(lowerAnswer::matches)) {
            return true;
        }
        
        // Check if answer contains any keywords
        for (String keyword : keywords) {
            String lowerKeyword = keyword.toLowerCase();
            if (lowerAnswer.contains(lowerKeyword)) {
                return false; // On topic
            }
        }
        
        // If answer has 2+ words and no keywords found, it's off-topic
        String[] words = answer.trim().split("\\s+");
        return words.length >= 2;
    }
    
    private void loadQuestions() throws IOException {
        ClassPathResource resource = new ClassPathResource("data/interview-questions.json");
        if (!resource.exists()) {
            System.err.println("Warning: interview-questions.json not found. Please copy from Node.js backend.");
            return;
        }
        String content = new String(Files.readAllBytes(resource.getFile().toPath()));
        JsonNode root = objectMapper.readTree(content);
        
        Iterator<Map.Entry<String, JsonNode>> domains = root.fields();
        while (domains.hasNext()) {
            Map.Entry<String, JsonNode> domainEntry = domains.next();
            String domainName = domainEntry.getKey().toLowerCase();
            Map<String, List<Map<String, Object>>> levels = new HashMap<>();
            
            Iterator<Map.Entry<String, JsonNode>> levelEntries = domainEntry.getValue().fields();
            while (levelEntries.hasNext()) {
                Map.Entry<String, JsonNode> levelEntry = levelEntries.next();
                String levelName = levelEntry.getKey().toLowerCase();
                List<Map<String, Object>> questions = new ArrayList<>();
                
                for (JsonNode questionNode : levelEntry.getValue()) {
                    Map<String, Object> question = objectMapper.convertValue(questionNode, Map.class);
                    questions.add(question);
                }
                
                levels.put(levelName, questions);
            }
            
            questionsCache.put(domainName, levels);
        }
    }
}

