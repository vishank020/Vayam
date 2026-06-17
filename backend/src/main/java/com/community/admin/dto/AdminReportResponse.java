package com.community.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminReportResponse(
    UUID id,
    String reason,
    Instant createdAt,
    String status,
    ReporterInfo reporter,
    ReportedUserInfo reportedUser,
    ReportedPostInfo reportedPost
) {
    public record ReporterInfo(UUID id, String username) {}
    public record ReportedUserInfo(UUID id, String username) {}
    public record ReportedPostInfo(UUID id, String title) {}
}
