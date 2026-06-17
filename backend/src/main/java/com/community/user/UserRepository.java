package com.community.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmailHash(String emailHash);
    User findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmailHash(String emailHash);

    java.util.List<User> findByUsernameContainingIgnoreCase(String username);
}
