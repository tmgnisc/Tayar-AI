package com.tayarai.repository;

import com.tayarai.model.CodingChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CodingChallengeRepository extends JpaRepository<CodingChallenge, Integer> {
    Optional<CodingChallenge> findBySlug(String slug);
    List<CodingChallenge> findByIsActiveTrue();
    List<CodingChallenge> findByDifficultyAndIsActiveTrue(CodingChallenge.ChallengeDifficulty difficulty);
}

