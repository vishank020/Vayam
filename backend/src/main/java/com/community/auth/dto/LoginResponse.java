package com.community.auth.dto;

public record LoginResponse(
        String userId,
        String username,
        String role,
        boolean requires2fa,
        String tempToken
) {
}
