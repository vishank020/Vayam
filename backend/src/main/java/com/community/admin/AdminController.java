package com.community.admin;

import com.community.admin.dto.AdminReportResponse;
import com.community.admin.dto.AdminUserSummary;
import com.community.auth.AuthPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/reports")
    public ResponseEntity<Page<AdminReportResponse>> getReports(
            @RequestParam(defaultValue = "OPEN") String status,
            Pageable pageable,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(adminService.getReports(status, pageable));
    }

    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<Void> resolveReport(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        adminService.resolveReport(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal AuthPrincipal principal) {
        adminService.deletePost(postId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal AuthPrincipal principal) {
        adminService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/mute")
    public ResponseEntity<Void> muteUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthPrincipal principal) {
        adminService.muteUser(UUID.fromString(principal.userId()), userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{userId}/mute")
    public ResponseEntity<Void> unmuteUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthPrincipal principal) {
        adminService.unmuteUser(UUID.fromString(principal.userId()), userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/search")
    public ResponseEntity<Page<AdminUserSummary>> searchUsers(
            @RequestParam String q,
            Pageable pageable,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(adminService.searchUsers(q, pageable));
    }
}
