package com.community.qna.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuestionResponse(
    UUID id,
    String title,
    String body,
    UUID authorId,
    String authorUsername,
    int answerCount,
    boolean isAuthor,
    int voteCount,
    Integer currentUserVote,
    List<AnswerResponse> answers,
    Instant createdAt,
    Instant updatedAt
) {}
