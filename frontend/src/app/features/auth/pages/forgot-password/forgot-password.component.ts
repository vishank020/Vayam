import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="forgot-container">
      <div class="forgot-card">
        <h1>Forgot Password</h1>
        <p class="subtitle">Enter your email and we'll send you a reset link</p>

        <div *ngIf="!submitted">
          <form (ngSubmit)="onSubmit()" #forgotForm="ngForm">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                [(ngModel)]="email"
                required
                email
                #emailInput="ngModel"
                placeholder="Enter your email"
              />
              <small *ngIf="emailInput.invalid && emailInput.touched" class="error">
                A valid email is required
              </small>
            </div>

            <div *ngIf="error" class="error-message">{{ error }}</div>

            <button type="submit" [disabled]="forgotForm.invalid || loading" class="btn-primary">
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </form>
        </div>

        <div *ngIf="submitted" class="success-message">
          If an account exists with that email, we've sent a reset link.
        </div>

        <p class="footer-text">
          <a routerLink="/login">&larr; Return to login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .forgot-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--bg-main);
    }
    .forgot-card {
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
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.95rem;
      text-align: center;
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
      .forgot-card { padding: 1.5rem; }
      h1 { font-size: 1.4rem; }
      .subtitle { font-size: 0.9rem; }
    }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  error = '';
  loading = false;
  submitted = false;

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.submitted = true;
        this.loading = false;
      },
      error: () => {
        this.submitted = true;
        this.loading = false;
      }
    });
  }
}
