package com.community.dm.dto;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
    UUID id,
    UUID conversationId,
    UUID senderId,
    String senderUsername,
    String body,
    Instant sentAt,
    Instant readAt
) {}
