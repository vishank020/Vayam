package com.community.anon;

import com.community.anon.dto.AnonymousIdentityResponse;
import com.community.anon.dto.AnonymousSessionResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class AnonymousService {

    private static final String[] ADJECTIVES = {
        "Curious", "Silent", "Brave", "Wise", "Swift", "Calm", "Bold",
        "Gentle", "Fierce", "Clever", "Lucky", "Noble", "Quiet", "Shy"
    };

    private static final String[] ANIMALS = {
        "Raven", "Wolf", "Dolphin", "Fox", "Eagle", "Bear", "Lion",
        "Otter", "Hawk", "Owl", "Panda", "Falcon", "Tiger", "Salmon"
    };

    private final AnonymousIdentityRepository repository;
    private final SecureRandom random;

    public AnonymousService(AnonymousIdentityRepository repository) {
        this.repository = repository;
        this.random = new SecureRandom();
    }

    @Transactional
    public AnonymousSessionResponse createSession() {
        String rawToken = UUID.randomUUID() + "-" + UUID.randomUUID();
        String hash = sha256(rawToken);
        String displayName = generateAlias();

        AnonymousIdentity identity = new AnonymousIdentity();
        identity.setSessionTokenHash(hash);
        identity.setDisplayName(displayName);
        repository.save(identity);

        return new AnonymousSessionResponse(identity.getId(), rawToken, displayName);
    }

    public AnonymousIdentityResponse getIdentity(String rawToken) {
        String hash = sha256(rawToken);
        AnonymousIdentity identity = repository.findBySessionTokenHash(hash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid anonymous session"));
        return new AnonymousIdentityResponse(identity.getId(), identity.getDisplayName(), identity.getCreatedAt());
    }

    @Transactional
    public void updateLastActive(String rawToken) {
        String hash = sha256(rawToken);
        repository.findBySessionTokenHash(hash).ifPresent(i -> {
            i.setLastActiveAt(Instant.now());
            repository.save(i);
        });
    }

    private String generateAlias() {
        String adj = ADJECTIVES[random.nextInt(ADJECTIVES.length)];
        String animal = ANIMALS[random.nextInt(ANIMALS.length)];
        return adj + " " + animal;
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
