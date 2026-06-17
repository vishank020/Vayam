package com.community.community.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record InviteUserRequest(
    @NotBlank(message = "User ID is required")
    UUID userId
) {}
