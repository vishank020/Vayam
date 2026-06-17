package com.community.auth.dto;

public record VerifyTwoFactorRequest(
        String tempToken,
        String code
) {
}
