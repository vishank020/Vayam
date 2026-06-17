package com.community.community.dto;

import java.time.Instant;
import java.util.UUID;

public record InviteLinkResponse(
    UUID id,
    UUID communityId,
    String code,
    UUID createdById,
    String createdByUsername,
    Instant expiresAt,
    Integer maxUses,
    int useCount,
    boolean active,
    Instant createdAt
) {}
