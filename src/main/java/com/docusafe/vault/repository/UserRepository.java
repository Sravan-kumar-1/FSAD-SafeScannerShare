package com.docusafe.vault.repository;

import com.docusafe.vault.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    java.util.List<User> findTop5ByEmailContainingIgnoreCase(String email);
}
