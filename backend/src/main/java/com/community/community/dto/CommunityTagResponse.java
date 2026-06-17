package com.community.community.dto;

import java.util.UUID;

public record CommunityTagResponse(
    UUID id,
    UUID communityId,
    String name,
    String color
) {}
