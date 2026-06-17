package com.community.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EditCommentRequest(
    @NotBlank(message = "Comment content cannot be empty")
    @Size(max = 5000, message = "Comment content is too long")
    String content
) {}
