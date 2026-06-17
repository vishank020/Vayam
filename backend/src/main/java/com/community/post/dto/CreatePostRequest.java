package com.community.post.dto;

import com.community.post.PostType;
import java.util.List;
import java.util.UUID;

public record CreatePostRequest(
    String title,
    String content,
    PostType postType,
    UUID communityId,
    boolean isAnonymous,
    List<String> mediaUrls,
    String scheduledAt,
    boolean saveAsDraft,
    UUID tagId
) {}