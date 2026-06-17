package com.community.anon.dto;

import java.util.UUID;

public record AnonymousSessionResponse(
    UUID id,
    String sessionToken,
    String displayName
) {}
