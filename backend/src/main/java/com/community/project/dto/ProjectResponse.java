package com.community.project.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ProjectResponse(
    UUID id,
    UUID userId,
    String title,
    String description,
    String techStack,
    String repoUrl,
    String liveUrl,
    LocalDate startDate,
    LocalDate endDate,
    Instant createdAt,
    Instant updatedAt
) {}
