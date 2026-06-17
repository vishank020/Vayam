package com.community.community.dto;

import com.community.community.CommunityRole;
import java.time.Instant;
import java.util.UUID;

public record CommunityMemberResponse(
    UUID id,
    UUID userId,
    String username,
    String avatarUrl,
    CommunityRole role,
    Instant joinedAt
) {}
