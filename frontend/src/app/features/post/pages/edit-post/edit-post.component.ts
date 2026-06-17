import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostService, PostResponse, CreatePostRequest } from '../../../../core/post.service';
import { CommunityService, CommunityResponse } from '../../../../core/community.service';
import { MarkdownEditorComponent } from '../../../shared/markdown-editor/markdown-editor.component';
import { PostDetailSkeletonComponent } from '../../../../shared/components/post-detail-skeleton.component';

@Component({
  selector: 'app-edit-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MarkdownEditorComponent, PostDetailSkeletonComponent],
  template: `
    <div class="edit-post-page">
      <a [routerLink]="['/posts', postId]" class="back-link">&larr; Back to Post</a>

      <app-post-detail-skeleton *ngIf="loading"></app-post-detail-skeleton>
      <div *ngIf="notFound" class="error">Post not found.</div>

      <div class="form-card" *ngIf="!loading && !notFound">
        <h1>Edit Post</h1>
        <form (ngSubmit)="submit()" #editForm="ngForm">
          <div class="form-group">
            <label for="title">Title</label>
            <input id="title" name="title" [(ngModel)]="request.title" required #title="ngModel" />
            <div class="error-hint" *ngIf="title.invalid && title.touched">Title is required</div>
          </div>

          <div class="form-group">
            <label for="content">Content</label>
            <app-markdown-editor [(value)]="request.content" [rows]="6"></app-markdown-editor>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="postType">Type</label>
              <select id="postType" name="postType" [(ngModel)]="request.postType">
                <option value="GENERAL">General</option>
                <option value="ACHIEVEMENT">Achievement</option>
                <option value="PROJECT">Project</option>
                <option value="JOB">Job</option>
              </select>
            </div>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" name="isAnonymous" [(ngModel)]="request.isAnonymous" />
              <span>Post anonymously</span>
            </label>
          </div>

          <button type="submit" class="btn-submit" [disabled]="editForm.invalid || submitting">
            {{ submitting ? 'Saving...' : 'Save Changes' }}
          </button>
          <div class="error-message" *ngIf="error">{{ error }}</div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .edit-post-page {
      max-width: 640px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }
    .back-link {
      color: var(--accent-color);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      display: inline-block;
      margin-bottom: 1rem;
    }
    .back-link:hover { text-decoration: underline; }
    .error {
      text-align: center;
      padding: 3rem 0;
      color: var(--danger);
      font-size: 1rem;
    }
    .form-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
    }
    .form-card h1 {
      margin: 0 0 1.25rem;
      font-size: 1.3rem;
      color: var(--text-main);
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.3rem;
    }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: inherit;
      box-sizing: border-box;
      background: var(--bg-main);
      color: var(--text-main);
    }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
    }
    .form-row .form-group { flex: 1; }
    .checkbox-group { margin-top: 0.5rem; }
    .checkbox-label {
      display: flex !important;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: 400 !important;
    }
    .checkbox-label input { width: auto; }
    .error-hint {
      color: var(--danger);
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    .btn-submit {
      background: var(--accent-color);
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-submit:hover:not(:disabled) { background: var(--accent-hover); }
    .error-message {
      color: var(--danger);
      margin-top: 0.75rem;
      font-size: 0.9rem;
    }
    @media (max-width: 767px) {
      .edit-post-page { padding: 1rem 0.75rem; }
      .form-card { padding: 1rem; }
    }
  `]
})
export class EditPostComponent implements OnInit {
  postId: string | null = null;
  request: CreatePostRequest = {
    title: '',
    content: '',
    postType: 'GENERAL',
    communityId: null,
    isAnonymous: false
  };
  loading = false;
  notFound = false;
  submitting = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService
  ) {}

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id');
    if (this.postId) {
      this.loadPost();
    }
  }

  loadPost(): void {
    this.loading = true;
    this.postService.getPost(this.postId!).subscribe({
      next: (post) => {
        this.request.title = post.title;
        this.request.content = post.content;
        this.request.postType = post.postType;
        this.request.communityId = post.communityId;
        this.request.isAnonymous = post.isAnonymous;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
      }
    });
  }

  submit(): void {
    if (!this.request.title.trim() || !this.request.content.trim()) return;
    this.submitting = true;
    this.error = '';
    this.postService.updatePost(this.postId!, this.request).subscribe({
      next: (post) => this.router.navigate(['/posts', post.id]),
      error: () => {
        this.error = 'Failed to update post.';
        this.submitting = false;
      }
    });
  }
}
