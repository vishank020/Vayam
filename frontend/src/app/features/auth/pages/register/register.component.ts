import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <h1>Create Account</h1>
        <p class="subtitle">Join the community platform</p>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              name="username"
              [(ngModel)]="username"
              required
              minlength="3"
              #usernameInput="ngModel"
              placeholder="Choose a username"
            />
            <small *ngIf="usernameInput.invalid && usernameInput.touched" class="error">
              Username must be at least 3 characters
            </small>
          </div>

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

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              [(ngModel)]="password"
              required
              minlength="8"
              #passwordInput="ngModel"
              placeholder="Create a password"
            />
            <small *ngIf="passwordInput.invalid && passwordInput.touched" class="error">
              Password must be at least 8 characters
            </small>
          </div>

          <div class="form-group">
            <label for="displayName">Display Name (optional)</label>
            <input
              id="displayName"
              name="displayName"
              [(ngModel)]="displayName"
              placeholder="How others see you"
            />
          </div>

          <div class="legal-consent">
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="acceptedTerms"
                [(ngModel)]="acceptedTerms"
                #acceptedTermsInput="ngModel"
                required
              />
              <span>
                I have read and agree to the
                <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" (click)="$event.stopPropagation()">Terms &amp; Conditions</a>
                and
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" (click)="$event.stopPropagation()">Privacy Policy</a>
              </span>
            </label>
            <small *ngIf="showConsentError" class="error">
              Please accept the Terms &amp; Conditions and Privacy Policy to continue.
            </small>
          </div>

          <p class="legal-disclaimer">
            By creating an account, you agree to our
            <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>
            and acknowledge that you have read our
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
          </p>

          <div *ngIf="error" class="error-message">{{ error }}</div>

          <button type="submit" [disabled]="registerForm.invalid || loading || !acceptedTerms" class="btn-primary">
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p class="footer-text">
          Already have an account? <a routerLink="/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--bg-main);
    }
    .register-card {
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
    .legal-consent {
      margin: 1.25rem 0 0.5rem;
    }
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-size: 0.88rem;
      color: var(--text-main);
      cursor: pointer;
      line-height: 1.4;
    }
    .checkbox-label input[type="checkbox"] {
      width: auto;
      margin-top: 0.15rem;
      flex-shrink: 0;
    }
    .checkbox-label a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
    }
    .checkbox-label a:hover {
      text-decoration: underline;
    }
    .legal-disclaimer {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin: 0.5rem 0 1rem;
      line-height: 1.4;
    }
    .legal-disclaimer a {
      color: var(--primary);
      text-decoration: none;
    }
    .legal-disclaimer a:hover {
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
  `]
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  displayName = '';
  acceptedTerms = false;
  error = '';
  loading = false;
  submitted = false;

  constructor(private authService: AuthService, private router: Router) {}

  get showConsentError(): boolean {
    return this.submitted && !this.acceptedTerms;
  }

  onSubmit(): void {
    this.submitted = true;
    if (!this.acceptedTerms) return;

    this.loading = true;
    this.error = '';
    this.authService.register({
      username: this.username,
      email: this.email,
      password: this.password,
      displayName: this.displayName || undefined,
      acceptedTerms: true
    }).subscribe({
      next: () => {
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
