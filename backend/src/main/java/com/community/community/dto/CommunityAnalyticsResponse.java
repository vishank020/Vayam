package com.community.community.dto;

public record CommunityAnalyticsResponse(
    long totalMembers,
    long totalPosts,
    long totalComments,
    long activeAuthors
) {}
