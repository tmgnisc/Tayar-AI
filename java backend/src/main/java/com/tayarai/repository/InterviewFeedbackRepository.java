package com.tayarai.repository;

import com.tayarai.model.InterviewFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewFeedbackRepository extends JpaRepository<InterviewFeedback, Integer> {
    List<InterviewFeedback> findByInterviewId(Integer interviewId);
}

