import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reset-container">
      <div class="reset-card">
        <h1>Reset Password</h1>
        <p class="subtitle">Choose a new password for your account</p>

        <div *ngIf="!submitted">
          <form (ngSubmit)="onSubmit()" #resetForm="ngForm">
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <div style="position: relative; display: flex; align-items: center;">
                <input
                  id="newPassword"
                  name="newPassword"
                  [type]="showNewPassword ? 'text' : 'password'"
                  [(ngModel)]="newPassword"
                  required
                  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&._#\\\\-]).{8,100}$"
                  #newPasswordInput="ngModel"
                  placeholder="At least 8 characters"
                  style="padding-right: 2.5rem; width: 100%;"
                />
                <button type="button" (click)="showNewPassword = !showNewPassword"
                        style="position: absolute; right: 0.75rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 0;">
                  <svg *ngIf="showNewPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  <svg *ngIf="!showNewPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
              <small *ngIf="newPasswordInput.invalid && newPasswordInput.touched" class="error">
                Password must be 8-100 characters and contain at least one uppercase, lowercase, digit, and special character (&#64;$!%*?&._#-).
              </small>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <div style="position: relative; display: flex; align-items: center;">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  [(ngModel)]="confirmPassword"
                  required
                  #confirmPasswordInput="ngModel"
                  placeholder="Re-enter your password"
                  style="padding-right: 2.5rem; width: 100%;"
                />
                <button type="button" (click)="showConfirmPassword = !showConfirmPassword"
                        style="position: absolute; right: 0.75rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 0;">
                  <svg *ngIf="showConfirmPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  <svg *ngIf="!showConfirmPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
              <small *ngIf="confirmPasswordInput.touched && newPassword !== confirmPassword" class="error">
                Passwords do not match
              </small>
            </div>

            <div *ngIf="error" class="error-message">{{ error }}</div>

            <button type="submit" [disabled]="resetForm.invalid || loading || newPassword !== confirmPassword" class="btn-primary">
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
        </div>

        <div *ngIf="submitted" class="success-message">
          Password reset successfully!
          <a routerLink="/login" class="success-link">Sign in with your new password</a>
        </div>

        <p class="footer-text">
          <a routerLink="/login">&larr; Return to login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .reset-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--bg-main);
    }
    .reset-card {
      background: var(--bg-main);
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 420px;
    }
    h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      color: var(--text-main);
    }
    .subtitle {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    label {
      display: block;
      margin-bottom: 0.4rem;
      font-weight: 500;
      color: var(--text-main);
    }
    input {
      width: 100%;
      padding: 0.7rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.95rem;
      box-sizing: border-box;
    }
    input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(var(--primary-rgb),0.15);
    }
    .error {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: block;
    }
    .error-message {
      background: #fde8e8;
      color: #c0392b;
      padding: 0.6rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .success-message {
      background: #e8fde8;
      color: #27ae60;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.95rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .success-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    .success-link:hover {
      text-decoration: underline;
    }
    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) {
      background: #3a5ce5;
    }
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .footer-text {
      text-align: center;
      margin-top: 1.25rem;
      color: var(--text-muted);
    }
    .footer-text a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
    }
    .footer-text a:hover {
      text-decoration: underline;
    }

    @media (max-width: 767px) {
      .reset-card { padding: 1.5rem; }
      h1 { font-size: 1.4rem; }
      .subtitle { font-size: 0.9rem; }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  error = '';
  loading = false;
  submitted = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  onSubmit(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.submitted = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to reset password. The link may have expired.';
        this.loading = false;
      }
    });
  }
}
