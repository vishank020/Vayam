package com.community.qna.dto;

import java.time.Instant;
import java.util.UUID;

public record AnswerResponse(
    UUID id,
    UUID questionId,
    String body,
    UUID authorId,
    String authorUsername,
    boolean isAccepted,
    boolean isAuthor,
    int voteCount,
    Integer currentUserVote,
    Instant createdAt,
    Instant updatedAt,
    String status
) {}
