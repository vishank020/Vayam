package com.community.anon.dto;

import java.time.Instant;
import java.util.UUID;

public record AnonymousIdentityResponse(
    UUID id,
    String displayName,
    Instant createdAt
) {}
