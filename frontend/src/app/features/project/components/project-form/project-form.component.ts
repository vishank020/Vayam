import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService, ProjectRequest, ProjectResponse } from '../../../../core/project.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="project-form-overlay" (click)="cancel()">
      <div class="project-form" (click)="$event.stopPropagation()">
        <h3>{{ project ? 'Edit Project' : 'Add Project' }}</h3>
        <div class="form-group">
          <label>Title *</label>
          <input [(ngModel)]="form.title" required placeholder="My Awesome Project" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea [(ngModel)]="form.description" rows="3" placeholder="What did you build?"></textarea>
        </div>
        <div class="form-group">
          <label>Tech Stack (comma-separated)</label>
          <input [(ngModel)]="form.techStack" placeholder="React, Node.js, PostgreSQL" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Repo URL</label>
            <input [(ngModel)]="form.repoUrl" placeholder="https://github.com/..." />
          </div>
          <div class="form-group">
            <label>Live URL</label>
            <input [(ngModel)]="form.liveUrl" placeholder="https://myapp.com" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" [(ngModel)]="form.startDate" />
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" [(ngModel)]="form.endDate" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-cancel" (click)="cancel()">Cancel</button>
          <button class="btn-save" (click)="save()" [disabled]="!form.title.trim()">Save</button>
        </div>
        <div class="error" *ngIf="error">{{ error }}</div>
      </div>
    </div>
  `,
  styles: [`
    .project-form-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .project-form {
      background: var(--bg-main);
      border-radius: 12px;
      padding: 1.5rem;
      width: 90%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .project-form h3 { margin: 0 0 1rem; font-size: 1.15rem; }
    .form-group { margin-bottom: 0.75rem; }
    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .form-group input, .form-group textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 0.9rem;
      box-sizing: border-box;
    }
    .form-group textarea { resize: vertical; }
    .form-row { display: flex; gap: 0.75rem; }
    .form-row .form-group { flex: 1; }
    .form-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; }
    .btn-cancel {
      padding: 0.4rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-main);
      cursor: pointer;
    }
    .btn-save {
      padding: 0.4rem 1rem;
      border: none;
      border-radius: 6px;
      background: var(--primary);
      color: white;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .error { color: #e74c3c; font-size: 0.85rem; margin-top: 0.5rem; }
  `]
})
export class ProjectFormComponent implements OnInit {
  @Input() project: ProjectResponse | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: ProjectRequest = { title: '' };
  error = '';

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    if (this.project) {
      this.form = {
        title: this.project.title,
        description: this.project.description,
        techStack: this.project.techStack,
        repoUrl: this.project.repoUrl,
        liveUrl: this.project.liveUrl,
        startDate: this.project.startDate,
        endDate: this.project.endDate
      };
    }
  }

  save(): void {
    this.error = '';
    const obs = this.project
      ? this.projectService.updateProject(this.project.id, this.form)
      : this.projectService.createProject(this.form);
    obs.subscribe({
      next: () => this.saved.emit(),
      error: () => this.error = 'Failed to save project'
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
