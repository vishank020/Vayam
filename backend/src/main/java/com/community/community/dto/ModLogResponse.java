package com.community.community.dto;

import com.community.community.ModAction;
import java.time.Instant;
import java.util.UUID;

public record ModLogResponse(
    UUID id,
    UUID communityId,
    UUID actorId,
    String actorUsername,
    String action,
    UUID targetId,
    String targetType,
    String details,
    Instant createdAt
) {}
