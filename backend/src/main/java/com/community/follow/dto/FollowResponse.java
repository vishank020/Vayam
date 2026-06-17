package com.community.follow.dto;

import java.time.Instant;
import java.util.UUID;

public record FollowResponse(
    UUID id,
    UUID userId,
    String username,
    String displayName,
    String avatarUrl,
    Instant createdAt
) {}
