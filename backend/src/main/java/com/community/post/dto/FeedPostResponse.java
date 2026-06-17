package com.community.post.dto;

import com.community.post.PostType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FeedPostResponse(
    UUID id,
    String title,
    String content,
    PostType postType,
    String authorUsername,
    String authorDisplayName,
    String authorAvatarUrl,
    boolean isAnonymous,
    UUID communityId,
    String communityName,
    String communitySlug,
    Instant createdAt,
    Instant updatedAt,
    long commentCount,
    long upvoteCount,
    long downvoteCount,
    Integer userVote,
    List<String> mediaUrls,
    boolean isSaved,
    boolean isPinned,
    String status,
    UUID tagId,
    String tagName,
    String tagColor
) {}