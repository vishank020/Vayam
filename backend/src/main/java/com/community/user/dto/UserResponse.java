package com.community.user.dto;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String username,
    String displayName,
    String bio,
    String avatarUrl,
    String coverUrl,
    String website,
    String location,
    String publicKey,
    String role,
    Instant createdAt,
    Long followerCount,
    Long followingCount,
    Long postCount,
    Long commentCount,
    Boolean isFollowing,
    boolean isTotpEnabled,
    Boolean isMuted,
    String email,
    boolean emailVerified
) {}
