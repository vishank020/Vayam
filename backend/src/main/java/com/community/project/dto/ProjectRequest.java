package com.community.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ProjectRequest(
    @NotBlank @Size(max = 255) String title,
    @Size(max = 5000) String description,
    @Size(max = 500) String techStack,
    @Size(max = 500) String repoUrl,
    @Size(max = 500) String liveUrl,
    LocalDate startDate,
    LocalDate endDate
) {}
