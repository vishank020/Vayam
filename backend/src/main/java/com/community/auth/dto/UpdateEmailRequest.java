package com.community.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// WHY: New email is applied immediately without verification.
// An email-verification flow should be added before production use.
public record UpdateEmailRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String newEmail
) {}
