package com.community.project;

import com.community.project.dto.ProjectRequest;
import com.community.project.dto.ProjectResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<ProjectResponse> getUserProjects(UUID userId) {
        return projectRepository.findByUserIdOrderByStartDateDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ProjectResponse getProject(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse createProject(UUID userId, ProjectRequest request) {
        Project project = new Project();
        project.setUserId(userId);
        applyRequest(project, request);
        projectRepository.save(project);
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(UUID userId, UUID projectId, ProjectRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!project.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to update this project");
        }
        applyRequest(project, request);
        project.setUpdatedAt(Instant.now());
        projectRepository.save(project);
        return toResponse(project);
    }

    @Transactional
    public void deleteProject(UUID userId, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!project.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to delete this project");
        }
        projectRepository.delete(project);
    }

    private void applyRequest(Project project, ProjectRequest request) {
        project.setTitle(request.title());
        project.setDescription(request.description());
        project.setTechStack(request.techStack());
        project.setRepoUrl(request.repoUrl());
        project.setLiveUrl(request.liveUrl());
        project.setStartDate(request.startDate());
        project.setEndDate(request.endDate());
    }

    private ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getUserId(),
                project.getTitle(),
                project.getDescription(),
                project.getTechStack(),
                project.getRepoUrl(),
                project.getLiveUrl(),
                project.getStartDate(),
                project.getEndDate(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
