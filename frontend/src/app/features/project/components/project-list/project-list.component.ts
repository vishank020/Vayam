import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService, ProjectResponse } from '../../../../core/project.service';
import { PostSkeletonComponent } from '../../../../shared/components/post-skeleton.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PostSkeletonComponent],
  template: `
    <div class="project-list" *ngIf="projects.length > 0">
      <div class="project-card" *ngFor="let project of projects">
        <div class="project-header">
          <h3 class="project-title">{{ project.title }}</h3>
          <div class="project-dates" *ngIf="project.startDate || project.endDate">
            {{ project.startDate || '?' }} – {{ project.endDate || 'Present' }}
          </div>
          <div class="project-actions" *ngIf="editable">
            <button class="btn-sm btn-edit" (click)="edit.emit(project)">Edit</button>
            <button class="btn-sm btn-delete" (click)="delete.emit(project)">Delete</button>
          </div>
        </div>
        <p class="project-description" *ngIf="project.description">{{ project.description }}</p>
        <div class="project-tech" *ngIf="project.techStack">
          <span class="tech-tag" *ngFor="let tech of parseTech(project.techStack)">{{ tech }}</span>
        </div>
        <div class="project-links" *ngIf="project.repoUrl || project.liveUrl">
          <a *ngIf="project.repoUrl" [href]="project.repoUrl" target="_blank" class="project-link">Repo</a>
          <a *ngIf="project.liveUrl" [href]="project.liveUrl" target="_blank" class="project-link">Live</a>
        </div>
      </div>
    </div>
    <div class="empty" *ngIf="projects.length === 0 && !loading">
      <p *ngIf="!editable">No projects yet.</p>
      <p *ngIf="editable">No projects yet. Add your first project!</p>
    </div>
    <app-post-skeleton *ngIf="loading" [count]="3"></app-post-skeleton>
  `,
  styles: [`
    .project-list { display: flex; flex-direction: column; gap: 1rem; }
    .project-card {
      background: var(--bg-main);
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 1.25rem;
      text-align: left;
    }
    .project-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .project-title { margin: 0; font-size: 1.1rem; color: var(--text-main); }
    .project-dates { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; }
    .project-actions { display: flex; gap: 0.35rem; flex-shrink: 0; }
    .btn-sm {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      background: var(--bg-main);
    }
    .btn-edit { color: var(--primary); }
    .btn-delete { color: #e74c3c; }
    .btn-sm:hover { background: var(--bg-main); }
    .project-description {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: 0.5rem 0;
      line-height: 1.4;
    }
    .project-tech { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.5rem 0; }
    .tech-tag {
      background: #eef2ff;
      color: var(--primary);
      font-size: 0.75rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .project-links { display: flex; gap: 0.75rem; }
    .project-link {
      color: var(--primary);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
    }
    .project-link:hover { text-decoration: underline; }
    .empty, .loading { color: var(--text-muted); padding: 1rem 0; font-size: 0.9rem; }
  `]
})
export class ProjectListComponent implements OnInit {
  @Input() userId!: string;
  @Input() editable = false;
  @Input() refreshTrigger = 0;
  @Output() edit = new EventEmitter<ProjectResponse>();
  @Output() delete = new EventEmitter<ProjectResponse>();

  projects: ProjectResponse[] = [];
  loading = false;

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  ngOnChanges(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    const obs = this.editable
      ? this.projectService.getMyProjects()
      : this.projectService.getUserProjects(this.userId);
    obs.subscribe({
      next: (data) => { this.projects = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  parseTech(techStack: string): string[] {
    return techStack.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }
}
