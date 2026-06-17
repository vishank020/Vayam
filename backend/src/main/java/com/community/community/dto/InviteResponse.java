package com.community.community.dto;

import com.community.community.InviteStatus;
import java.time.Instant;
import java.util.UUID;

public record InviteResponse(
    UUID id,
    UUID communityId,
    UUID inviterId,
    String inviterUsername,
    UUID inviteeId,
    String inviteeUsername,
    InviteStatus status,
    Instant createdAt
) {}
