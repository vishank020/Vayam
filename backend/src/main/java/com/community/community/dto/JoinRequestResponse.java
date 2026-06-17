package com.community.community.dto;

import com.community.community.JoinRequestStatus;
import java.time.Instant;
import java.util.UUID;

public record JoinRequestResponse(
    UUID id,
    UUID communityId,
    UUID userId,
    String username,
    JoinRequestStatus status,
    Instant createdAt
) {}
