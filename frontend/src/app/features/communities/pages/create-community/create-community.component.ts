import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommunityService } from '../../../../core/community.service';

@Component({
  selector: 'app-create-community',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <h1>Create Community</h1>
        <p class="subtitle">Start a new community for people to join</p>

        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <div class="form-group">
            <label for="name">Community Name</label>
            <input
              id="name"
              name="name"
              [(ngModel)]="name"
              (ngModelChange)="onNameChange($event)"
              required
              minlength="2"
              #nameInput="ngModel"
              placeholder="e.g. React Developers"
            />
            <small *ngIf="nameInput.invalid && nameInput.touched" class="error">
              Name must be at least 2 characters
            </small>
          </div>

          <div class="form-group">
            <label for="slug">Community URL slug</label>
            <div class="slug-input-wrapper">
              <span class="slug-prefix">c/</span>
              <input
                id="slug"
                name="slug"
                [(ngModel)]="slug"
                (ngModelChange)="onSlugChange($event)"
                required
                placeholder="react-developers"
              />
            </div>
            <small class="slug-preview">
              URL Preview: <strong>c/{{ slug || 'your-slug' }}</strong>
            </small>
          </div>

          <div class="form-group">
            <label for="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              [(ngModel)]="description"
              placeholder="What is this community about?"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Visibility</label>
            <div class="radio-group">
              <label class="radio">
                <input type="radio" name="visibility" [(ngModel)]="visibility" value="PUBLIC" />
                <div>
                  <strong>Public</strong>
                  <small>Anyone can see and join</small>
                </div>
              </label>
              <label class="radio">
                <input type="radio" name="visibility" [(ngModel)]="visibility" value="PRIVATE" />
                <div>
                  <strong>Private</strong>
                  <small>Invite-only, hidden from non-members</small>
                </div>
              </label>
            </div>
          </div>

          <div *ngIf="error" class="error-message">{{ error }}</div>

          <button type="submit" [disabled]="form.invalid || loading" class="btn-primary">
            {{ loading ? 'Creating...' : 'Create Community' }}
          </button>
        </form>

        <p class="footer-text">
          <a routerLink="/communities">&larr; Back to communities</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      display: flex; justify-content: center; align-items: center; min-height: 100vh; background: var(--bg-main);
    }
    .card {
      background: var(--bg-main); padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      width: 100%; max-width: 480px;
    }
    h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: var(--text-main); }
    .subtitle { color: var(--text-muted); margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.4rem; font-weight: 500; color: var(--text-main); }
    input, textarea {
      width: 100%; padding: 0.7rem 0.75rem; border: 1px solid var(--border-color); border-radius: 8px;
      font-size: 0.95rem; box-sizing: border-box;
    }
    input:focus, textarea:focus {
      outline: none; border-color: var(--primary); box-shadow: 0 0 0 2px rgba(var(--primary-rgb),0.15);
    }
    textarea { resize: vertical; font-family: inherit; }
    .slug-input-wrapper {
      display: flex; align-items: center; gap: 0.5rem;
    }
    .slug-prefix {
      font-size: 1.1rem; color: var(--text-muted); font-weight: 700;
    }
    .slug-preview {
      display: block; margin-top: 0.3rem; font-size: 0.8rem; color: var(--text-muted);
    }
    .radio-group { display: flex; flex-direction: column; gap: 0.6rem; }
    .radio {
      display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.75rem;
      border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: border-color 0.2s;
    }
    .radio:hover { border-color: var(--primary); }
    .radio input[type="radio"] { margin-top: 0.2rem; width: auto; }
    .radio strong { display: block; font-size: 0.9rem; }
    .radio small { color: var(--text-muted); font-size: 0.8rem; }
    .error { color: #e74c3c; font-size: 0.8rem; margin-top: 0.25rem; display: block; }
    .error-message {
      background: #fde8e8; color: #c0392b; padding: 0.6rem; border-radius: 8px;
      margin-bottom: 1rem; font-size: 0.9rem;
    }
    .btn-primary {
      width: 100%; padding: 0.75rem; background: var(--primary); color: white; border: none;
      border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) { background: #3a5ce5; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .footer-text { text-align: center; margin-top: 1.25rem; }
    .footer-text a { color: var(--primary); text-decoration: none; font-weight: 500; }
    .footer-text a:hover { text-decoration: underline; }
  `]
})
export class CreateCommunityComponent {
  name = '';
  slug = '';
  description = '';
  visibility = 'PUBLIC';
  error = '';
  loading = false;
  isSlugCustomized = false;

  constructor(
    private communityService: CommunityService,
    private router: Router
  ) {}

  slugify(text: string): string {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  onNameChange(newName: string): void {
    if (!this.isSlugCustomized) {
      this.slug = this.slugify(newName);
    }
  }

  onSlugChange(newSlug: string): void {
    this.isSlugCustomized = true;
    this.slug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.communityService.create({
      name: this.name,
      slug: this.slug || undefined,
      description: this.description || undefined,
      visibility: this.visibility
    }).subscribe({
      next: (community) => {
        this.router.navigate(['/c', community.slug]);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to create community.';
        this.loading = false;
      }
    });
  }
}
