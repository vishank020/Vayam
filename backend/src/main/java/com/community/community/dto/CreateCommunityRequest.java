package com.community.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommunityRequest(
    @NotBlank(message = "Community name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    String name,

    String description,

    String visibility,

    String slug
) {}
