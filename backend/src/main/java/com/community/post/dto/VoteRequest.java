package com.community.post.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record VoteRequest(
    @NotNull @Min(-1) @Max(1) Integer direction
) {}
