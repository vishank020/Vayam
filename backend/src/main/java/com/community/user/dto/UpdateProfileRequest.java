package com.community.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    String displayName,
    @Size(max = 200) String bio,
    @Size(max = 500) String avatarUrl,
    @Size(max = 500) String coverUrl,
    @Size(max = 255) String website,
    @Size(max = 255) String location
) {}
