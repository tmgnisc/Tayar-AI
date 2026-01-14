package com.tayarai.repository;

import com.tayarai.model.CodeSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CodeSubmissionRepository extends JpaRepository<CodeSubmission, Integer> {
    List<CodeSubmission> findByUserIdOrderByCreatedAtDesc(Integer userId);
}

