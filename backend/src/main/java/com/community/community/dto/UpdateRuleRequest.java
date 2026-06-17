package com.community.community.dto;

import jakarta.validation.constraints.Size;

public record UpdateRuleRequest(
    @Size(max = 200) String title,
    @Size(max = 1000) String description,
    Integer position
) {}
