package com.community.user.dto;

import jakarta.validation.constraints.NotBlank;

public record PublicKeyRequest(
    @NotBlank(message = "Public key is required")
    String publicKey
) {}
