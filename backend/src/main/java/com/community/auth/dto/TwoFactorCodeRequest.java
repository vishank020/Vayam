package com.community.auth.dto;

public record TwoFactorCodeRequest(
        String code,
        String secret
) {
}
