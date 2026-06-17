package com.community.follow.dto;

public record FollowCountResponse(
    long followersCount,
    long followingCount
) {}
