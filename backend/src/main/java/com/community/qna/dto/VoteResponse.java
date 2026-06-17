package com.community.qna.dto;

import java.util.UUID;

public record VoteResponse(
    UUID targetId,
    int voteCount,
    Integer currentUserVote
) {}
