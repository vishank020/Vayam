package com.community.notification.dto;

import com.community.notification.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    NotificationType type,
    UUID referenceId,
    String referenceType,
    String actorUsername,
    String actorAvatarUrl,
    String message,
    boolean isRead,
    Instant createdAt
) {}
