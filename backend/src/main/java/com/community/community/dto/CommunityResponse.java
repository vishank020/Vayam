package com.community.community.dto;

import com.community.community.CommunityVisibility;
import java.time.Instant;
import java.util.UUID;

public record CommunityResponse(
    UUID id,
    String name,
    String description,
    CommunityVisibility visibility,
    UUID ownerId,
    String ownerUsername,
    int memberCount,
    boolean isMember,
    CommunityRole role,
    String avatarUrl,
    String bannerUrl,
    String slug,
    Instant createdAt,
    Instant updatedAt
) {
    public enum CommunityRole { OWNER, ADMIN, MOD, MEMBER, NONE }
}
