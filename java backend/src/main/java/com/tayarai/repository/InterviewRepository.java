package com.tayarai.repository;

import com.tayarai.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Integer> {
    List<Interview> findByUserIdOrderByCompletedAtDesc(Integer userId);
    
    @Query("SELECT i FROM Interview i WHERE i.user.id = :userId AND i.status = 'COMPLETED'")
    List<Interview> findCompletedInterviewsByUserId(@Param("userId") Integer userId);
    
    @Query("SELECT COUNT(i) FROM Interview i WHERE i.user.id = :userId AND i.status = 'COMPLETED'")
    Long countCompletedInterviewsByUserId(@Param("userId") Integer userId);
    
    @Query("SELECT COUNT(i) FROM Interview i WHERE i.user.id = :userId AND i.startedAt >= :startDate AND i.startedAt < :endDate")
    Long countInterviewsByUserIdAndDateRange(
        @Param("userId") Integer userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}

