package com.community.comment.dto;

import java.time.Instant;
import java.util.UUID;

public record CommentResponse(
    UUID id,
    UUID postId,
    UUID parentId,
    UUID authorId,
    String authorUsername,
    String authorDisplayName,
    String authorAvatarUrl,
    String content,
    boolean isAnonymous,
    boolean isAuthor,
    Instant createdAt,
    Instant updatedAt,
    long upvoteCount,
    long downvoteCount,
    Integer userVote,
    java.util.List<CommentResponse> replies
) {}
