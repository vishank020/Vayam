package com.community.search.dto;

import java.util.List;

public record SearchResponse(
    List<SearchResult> results,
    long total,
    int page,
    int size
) {}
