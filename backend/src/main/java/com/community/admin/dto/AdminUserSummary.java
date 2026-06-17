package com.community.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminUserSummary(
    UUID id,
    String username,
    String displayName,
    String role,
    Instant createdAt,
    long openReportCount
) {}
