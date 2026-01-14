package com.tayarai.repository;

import com.tayarai.model.UserCv;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserCvRepository extends JpaRepository<UserCv, Integer> {
    List<UserCv> findByUserId(Integer userId);
    Optional<UserCv> findFirstByUserIdOrderByUpdatedAtDesc(Integer userId);
}

