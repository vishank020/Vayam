package com.community.auth.dto;

// WHY: Tokens are set via HttpOnly cookies, not returned in the response body.
// The response carries only identity info the frontend needs immediately.
public record AuthResponse(String userId, String username, String role) {
}
