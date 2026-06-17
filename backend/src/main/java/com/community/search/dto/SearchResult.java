package com.community.search.dto;

import java.util.UUID;

public record SearchResult(
    UUID id,
    String type,
    String title,
    String description,
    String url,
    String avatarUrl
) {}
