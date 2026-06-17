package com.community.community.dto;

import com.community.community.CommunityRole;
import java.time.Instant;
import java.util.UUID;

public record BanResponse(
    UUID id,
    UUID communityId,
    UUID userId,
    String username,
    String avatarUrl,
    UUID bannedById,
    String bannedByUsername,
    String reason,
    String duration,
    Instant expiresAt,
    boolean active,
    Instant createdAt
) {}
