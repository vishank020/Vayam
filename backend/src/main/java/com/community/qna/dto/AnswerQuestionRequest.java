package com.community.qna.dto;

import jakarta.validation.constraints.NotBlank;

public record AnswerQuestionRequest(
    @NotBlank(message = "Body is required")
    String body,
    boolean saveAsDraft
) {}
