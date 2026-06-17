package com.community.community.dto;

import jakarta.validation.constraints.Positive;

public record CreateInviteLinkRequest(
    String expiresAt,
    @Positive Integer maxUses
) {}
