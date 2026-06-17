package com.community.auth.dto;

import com.community.auth.AuthTokens;

public record LoginResult(
    AuthTokens tokens,
    boolean requires2fa,
    String tempToken
) {}
