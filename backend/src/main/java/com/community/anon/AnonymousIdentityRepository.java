package com.community.anon;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AnonymousIdentityRepository extends JpaRepository<AnonymousIdentity, UUID> {
    Optional<AnonymousIdentity> findBySessionTokenHash(String sessionTokenHash);
}
