package com.community.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&._#\\\\-]).{8,100}$",
            message = "Password must be 8-100 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&._#-)"
        )
        String newPassword
) {}
