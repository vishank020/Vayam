package com.community.dm.dto;

import java.util.Set;
import java.util.UUID;

public record CreateConversationRequest(
    Set<UUID> participantIds
) {}
