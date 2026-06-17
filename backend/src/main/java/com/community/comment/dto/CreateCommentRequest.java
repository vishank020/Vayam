package com.community.comment.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreateCommentRequest(
    @NotBlank String content,
    UUID parentId
) {}
