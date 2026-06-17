package com.community.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRuleRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 1000) String description,
    int position
) {}
