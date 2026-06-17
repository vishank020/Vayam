package com.community.community.dto;

import jakarta.validation.constraints.Size;

public record BanRequest(
    @Size(max = 500) String reason,
    String duration
) {}
