package com.tayarai.repository;

import com.tayarai.model.Domain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DomainRepository extends JpaRepository<Domain, Integer> {
    Optional<Domain> findByName(String name);
    boolean existsByName(String name);
}

