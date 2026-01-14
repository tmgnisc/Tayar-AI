package com.tayarai.repository;

import com.tayarai.model.CodingStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CodingStatsRepository extends JpaRepository<CodingStats, Integer> {
    Optional<CodingStats> findByUserId(Integer userId);
}

