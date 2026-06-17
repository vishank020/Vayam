package com.community.project;

import com.community.auth.AuthPrincipal;
import com.community.project.dto.ProjectRequest;
import com.community.project.dto.ProjectResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/users/me/projects")
    public ResponseEntity<List<ProjectResponse>> getMyProjects(
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(projectService.getUserProjects(
                UUID.fromString(principal.userId())));
    }

    @PostMapping("/users/me/projects")
    public ResponseEntity<ProjectResponse> createProject(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody ProjectRequest request) {
        ProjectResponse response = projectService.createProject(
                UUID.fromString(principal.userId()), request);
        return ResponseEntity.created(URI.create("/api/users/me/projects/" + response.id()))
                .body(response);
    }

    @PutMapping("/users/me/projects/{id}")
    public ResponseEntity<ProjectResponse> updateProject(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(
                UUID.fromString(principal.userId()), id, request));
    }

    @DeleteMapping("/users/me/projects/{id}")
    public ResponseEntity<Void> deleteProject(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {
        projectService.deleteProject(UUID.fromString(principal.userId()), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}/projects")
    public ResponseEntity<List<ProjectResponse>> getUserProjects(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(projectService.getUserProjects(userId));
    }
}
