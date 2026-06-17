import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1 *ngIf="step === 'login'">Welcome Back</h1>
        <p class="subtitle" *ngIf="step === 'login'">Sign in to your account</p>
        
        <h1 *ngIf="step === '2fa'">Two-Factor Authentication</h1>
        <p class="subtitle" *ngIf="step === '2fa'">Enter the 6-digit code from your authenticator app</p>

        <form *ngIf="step === 'login'" (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              name="username"
              [(ngModel)]="username"
              required
              #usernameInput="ngModel"
              placeholder="Enter your username"
            />
            <small *ngIf="usernameInput.invalid && usernameInput.touched" class="error">
              Username is required
            </small>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div style="position: relative; display: flex; align-items: center;">
              <input
                id="password"
                name="password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                required
                #passwordInput="ngModel"
                placeholder="Enter your password"
                style="padding-right: 2.5rem; width: 100%;"
              />
              <button type="button" (click)="showPassword = !showPassword"
                      style="position: absolute; right: 0.75rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 0;">
                <svg *ngIf="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                <svg *ngIf="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
            <small *ngIf="passwordInput.invalid && passwordInput.touched" class="error">
              Password is required
            </small>
          </div>

          <div *ngIf="error" class="error-message">{{ error }}</div>

          <button type="submit" [disabled]="loginForm.invalid || loading" class="btn-primary">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <form *ngIf="step === '2fa'" (ngSubmit)="onVerify()" #totpForm="ngForm">
          <div class="form-group">
            <label for="totpCode">Authenticator Code</label>
            <input
              id="totpCode"
              name="totpCode"
              type="text"
              [(ngModel)]="totpCode"
              required
              pattern="[0-9]{6}"
              maxlength="6"
              #codeInput="ngModel"
              placeholder="123456"
            />
            <small *ngIf="codeInput.invalid && codeInput.touched" class="error">
              Please enter a valid 6-digit code
            </small>
          </div>

          <div *ngIf="error" class="error-message">{{ error }}</div>

          <button type="submit" [disabled]="totpForm.invalid || loading" class="btn-primary">
            {{ loading ? 'Verifying...' : 'Verify' }}
          </button>
        </form>

        <p class="footer-text" *ngIf="step === 'login'">
          Don't have an account? <a routerLink="/register">Create one</a>
        </p>

        <div class="legal-links">
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          <span class="separator">&middot;</span>
          <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--bg-main);
    }
    .login-card {
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
    .legal-links {
      text-align: center;
      margin-top: 1rem;
      font-size: 0.82rem;
    }
    .legal-links a {
      color: var(--text-muted);
      text-decoration: none;
    }
    .legal-links a:hover {
      color: var(--primary);
      text-decoration: underline;
    }
    .separator {
      margin: 0 0.5rem;
      color: var(--text-muted);
    }

    @media (max-width: 767px) {
      .login-card { padding: 1.5rem; }
      h1 { font-size: 1.4rem; }
      .subtitle { font-size: 0.9rem; }
    }
  `]
})
export class LoginComponent {
  step: 'login' | '2fa' = 'login';
  username = '';
  password = '';
  showPassword = false;
  totpCode = '';
  tempToken = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        if (res.requires2fa && res.tempToken) {
          this.step = '2fa';
          this.tempToken = res.tempToken;
          this.loading = false;
        } else {
          this.router.navigate(['/feed']);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid username or password.';
        this.loading = false;
      }
    });
  }

  onVerify(): void {
    this.loading = true;
    this.error = '';
    this.authService.verifyLogin(this.tempToken, this.totpCode).subscribe({
      next: () => {
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        this.error = 'Invalid authenticator code.';
        this.loading = false;
      }
    });
  }
}
