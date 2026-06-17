package com.community.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record CommunityTagRequest(
    @NotBlank
    @Size(min = 2, max = 30)
    @Pattern(regexp = "^[a-zA-Z0-9 -]+$", message = "Only letters, numbers, spaces, and hyphens allowed")
    String name,
    String color
) {}
