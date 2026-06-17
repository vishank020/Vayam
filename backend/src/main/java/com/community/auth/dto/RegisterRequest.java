package com.community.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
    String username,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&._#\\\\-]).{8,100}$",
        message = "Password must be 8-100 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&._#-)"
    )
    String password,

    String displayName,

    @NotNull(message = "Terms acceptance is required")
    @AssertTrue(message = "Terms acceptance is required")
    Boolean acceptedTerms
) {}
