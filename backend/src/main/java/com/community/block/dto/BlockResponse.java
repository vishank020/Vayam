package com.community.block.dto;

import java.time.Instant;
import java.util.UUID;

public record BlockResponse(
    UUID id,
    UUID blockedId,
    Instant createdAt
) {}
