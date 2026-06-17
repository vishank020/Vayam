package com.community.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUsernameRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New username is required")
        @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
        String newUsername
) {}
