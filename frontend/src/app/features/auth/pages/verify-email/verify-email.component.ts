import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="verify-container">
      <div class="verify-card">
        <h1>Email Verification</h1>

        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Verifying your email...</p>
        </div>

        <div *ngIf="!loading && verified" class="success-message">
          Email verified!
          <a routerLink="/login" class="success-link">Sign in to your account</a>
          <a routerLink="/feed" class="success-link">Browse the community</a>
        </div>

        <div *ngIf="!loading && error" class="error-message">{{ error }}</div>

        <p class="footer-text" *ngIf="!loading">
          <a routerLink="/login">&larr; Return to login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .verify-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--bg-main);
    }
    .verify-card {
      background: var(--bg-main);
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 420px;
      text-align: center;
    }
    h1 {
      margin: 0 0 1.5rem;
      font-size: 1.75rem;
      color: var(--text-main);
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: var(--text-muted);
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .success-message {
      background: #e8fde8;
      color: #27ae60;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .success-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
    }
    .success-link:hover {
      text-decoration: underline;
    }
    .error-message {
      background: #fde8e8;
      color: #c0392b;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.95rem;
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
      .verify-card { padding: 1.5rem; }
      h1 { font-size: 1.4rem; }
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  verified = false;
  error = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (!token) {
        this.loading = false;
        this.error = 'Invalid verification link. No token provided.';
        return;
      }
      this.authService.verifyEmail(token).subscribe({
        next: () => {
          this.verified = true;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Verification failed. The link may have expired.';
          this.loading = false;
        }
      });
    });
  }
}
