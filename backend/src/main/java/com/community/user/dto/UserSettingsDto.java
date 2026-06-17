package com.community.user.dto;

public record UserSettingsDto(
    String theme,
    String accentColor,
    Boolean notifyComments,
    Boolean notifyReplies,
    Boolean notifyMentions,
    Boolean notifyFollows,
    Boolean notifySystem,
    Boolean showEmail,
    Boolean showWebsite,
    Boolean showLocation,
    Boolean allowDiscovery,
    Boolean allowFollowRequests,
    Boolean anonymousBrowsing
) {}
