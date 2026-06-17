package com.community.community.dto;

import java.time.Instant;
import java.util.UUID;

public record CommunityRuleResponse(
    UUID id,
    UUID communityId,
    String title,
    String description,
    int position,
    Instant createdAt
) {}
