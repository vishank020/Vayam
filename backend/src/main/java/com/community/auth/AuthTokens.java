package com.community.auth;

public record AuthTokens(String accessToken, String refreshToken, String userId, String username, String role) {
}
