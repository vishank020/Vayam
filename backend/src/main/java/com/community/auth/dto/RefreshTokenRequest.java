package com.community.auth.dto;

// WHY: Refresh endpoint reads the refresh token from HttpOnly cookie,
// not from request body. This DTO remains for backward compatibility
// with API clients that send refresh token in the request body.
public record RefreshTokenRequest(String refreshToken) {
}
