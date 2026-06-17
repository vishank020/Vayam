package com.community.auth.dto;

public record GenerateTwoFactorResponse(
        String qrCodeImage,
        String secret
) {
}
