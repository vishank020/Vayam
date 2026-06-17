package com.community.report;

import com.community.auth.AuthPrincipal;
import com.community.user.dto.ReportRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<Void> report(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ReportRequest request) {
        reportService.report(UUID.fromString(principal.userId()), id, request.reason());
        return ResponseEntity.ok().build();
    }
}
