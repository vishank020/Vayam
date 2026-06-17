package com.community.dm.dto;

import java.time.Instant;
import java.util.UUID;

public record ConversationResponse(
    UUID id,
    UUID otherParticipantId,
    String otherParticipantUsername,
    String otherParticipantDisplayName,
    String lastMessage,
    Instant lastMessageAt,
    Instant createdAt,
    long unreadCount
) {}
