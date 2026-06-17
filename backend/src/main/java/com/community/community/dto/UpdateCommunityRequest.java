package com.community.community.dto;

public record UpdateCommunityRequest(
    String name,
    String description,
    String visibility,
    String avatarUrl,
    String bannerUrl
) {}
