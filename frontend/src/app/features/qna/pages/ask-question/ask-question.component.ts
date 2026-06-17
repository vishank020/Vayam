import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { QnaService } from '../../../../core/qna.service';
import { MarkdownEditorComponent } from '../../../shared/markdown-editor/markdown-editor.component';

@Component({
  selector: 'app-ask-question',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MarkdownEditorComponent],
  template: `
    <div class="container">
      <div class="card">
        <h1>Ask a Question</h1>
        <p class="subtitle">Get help from the community</p>

        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <div class="form-group">
            <label for="title">Title</label>
            <input
              id="title"
              name="title"
              [(ngModel)]="title"
              required
              minlength="5"
              #titleInput="ngModel"
              placeholder="What's your question?"
            />
            <small *ngIf="titleInput.invalid && titleInput.touched" class="error">
              Title must be at least 5 characters
            </small>
          </div>

          <div class="form-group">
            <label for="body">Details</label>
            <app-markdown-editor [(value)]="body" [rows]="6" placeholder="Provide details about your question..."></app-markdown-editor>
            <small *ngIf="body.length === 0" class="error">
              Body is required
            </small>
          </div>

          <div *ngIf="error" class="error-message">{{ error }}</div>

          <button type="submit" [disabled]="form.invalid || !body.trim() || loading" class="btn-primary">
            {{ loading ? 'Posting...' : 'Post Question' }}
          </button>
        </form>

        <p class="footer-text">
          <a routerLink="/questions">&larr; Back to questions</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: var(--bg-main); }
    .card { background: var(--bg-main); padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 600px; }
    h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: var(--text-main); }
    .subtitle { color: var(--text-muted); margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.4rem; font-weight: 500; color: var(--text-main); }
    input, textarea { width: 100%; padding: 0.7rem 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; }
    input:focus, textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 2px rgba(var(--primary-rgb),0.15); }
    textarea { resize: vertical; font-family: inherit; }
    .error { color: #e74c3c; font-size: 0.8rem; margin-top: 0.25rem; display: block; }
    .error-message { background: #fde8e8; color: #c0392b; padding: 0.6rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
    .btn-primary { width: 100%; padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { background: #3a5ce5; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .footer-text { text-align: center; margin-top: 1.25rem; }
    .footer-text a { color: var(--primary); text-decoration: none; font-weight: 500; }
    .footer-text a:hover { text-decoration: underline; }

    @media (max-width: 767px) {
      .container { padding: 1rem; min-height: auto; align-items: flex-start; }
      .card { padding: 1.25rem; max-width: 100%; box-shadow: none; }
      h1 { font-size: 1.4rem; }
      input { font-size: 16px; }
      textarea { font-size: 16px; min-height: 120px; }
    }
  `]
})
export class AskQuestionComponent {
  title = '';
  body = '';
  error = '';
  loading = false;

  constructor(private qnaService: QnaService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.qnaService.askQuestion({ title: this.title, body: this.body }).subscribe({
      next: (q) => this.router.navigate(['/questions', q.id]),
      error: (err) => { this.error = err.error?.error || 'Failed to post question.'; this.loading = false; }
    });
  }
}
