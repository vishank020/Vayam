import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SettingsService, UserSettingsResponse } from '../../../../core/settings.service';
import { AnonymousBrowsingService } from '../../../../core/anonymous-browsing.service';
import { AuthService } from '../../../../core/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../../../core/theme.service';
import { ToastService } from '../../../../core/toast.service';
import { SettingsSkeletonComponent } from '../../../../shared/components/settings-skeleton.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SettingsSkeletonComponent],
  template: `
    <div class="settings-container">
      <div class="settings-sidebar">
        <h2>Settings</h2>
        <nav class="settings-nav">
          <button [class.active]="activeSection === 'appearance'" (click)="activeSection = 'appearance'">Appearance</button>
          <button [class.active]="activeSection === 'notifications'" (click)="activeSection = 'notifications'">Notifications</button>
          <button [class.active]="activeSection === 'privacy'" (click)="activeSection = 'privacy'">Privacy & Safety</button>
          <button [class.active]="activeSection === 'account'" (click)="activeSection = 'account'">Account</button>
          <button [class.active]="activeSection === 'security'" (click)="activeSection = 'security'">Security</button>
          <button [class.active]="activeSection === 'about'" (click)="activeSection = 'about'">About</button>
        </nav>
      </div>

      <app-settings-skeleton *ngIf="settingsLoading"></app-settings-skeleton>

      <div class="settings-content" *ngIf="!settingsLoading && settings">
        
        <!-- Appearance -->
        <div class="settings-section" *ngIf="activeSection === 'appearance'">
          <h3>Appearance</h3>
          <p class="section-description">Customize how the application looks to you.</p>

          <div class="setting-item">
            <div class="setting-info">
              <label>Theme</label>
              <p>Select your preferred color theme.</p>
            </div>
            <div class="setting-control">
              <select [(ngModel)]="settings.theme" (ngModelChange)="onThemeChange()">
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Accent Color</label>
              <p>Choose your preferred accent color.</p>
            </div>
            <div class="setting-control color-picker-control">
              <input type="color" [ngModel]="settings.accentColor" (ngModelChange)="onAccentInput($event)" class="color-picker" />
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="settings-section" *ngIf="activeSection === 'notifications'">
          <h3>Notifications</h3>
          <p class="section-description">Manage what events trigger a notification.</p>

          <div class="setting-item">
            <div class="setting-info">
              <label>Comments</label>
              <p>Get notified when someone comments on your post.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.notifyComments" (ngModelChange)="onToggleChange('notifyComments', $event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Replies</label>
              <p>Get notified when someone replies to your comment.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.notifyReplies" (ngModelChange)="onToggleChange('notifyReplies', $event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Mentions</label>
              <p>Get notified when you are &#64;mentioned.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.notifyMentions" (ngModelChange)="onToggleChange('notifyMentions', $event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>New Followers</label>
              <p>Get notified when someone follows you.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.notifyFollows" (ngModelChange)="onToggleChange('notifyFollows', $event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>System notifications</label>
              <p>Receive notifications about account activity, security alerts, and platform updates.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.notifySystem" (ngModelChange)="onToggleChange('notifySystem', $event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Privacy & Safety -->
        <div class="settings-section" *ngIf="activeSection === 'privacy'">
          <h3>Privacy & Safety</h3>
          <p class="section-description">Control what information is visible on your profile.</p>

          <div class="setting-item">
            <div class="setting-info">
              <label>Show Location</label>
              <p>Display your location on your public profile.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.showLocation" (ngModelChange)="onToggleChange('showLocation', $event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Show Website</label>
              <p>Display your website link on your public profile.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.showWebsite" (ngModelChange)="onToggleChange('showWebsite', $event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Allow follow requests</label>
              <p>Other users can send you follow requests.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.allowFollowRequests" (ngModelChange)="onToggleChange('allowFollowRequests', $event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Anonymous Browsing</label>
              <p>Browse without generating activity signals or exposing your identity.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [ngModel]="isAnonymousMode" (ngModelChange)="toggleAnonymousMode($event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Show email on profile</label>
              <p>Your email address will be visible on your public profile.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.showEmail" (ngModelChange)="onToggleChange('showEmail', $event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Allow profile discovery</label>
              <p>Your profile can appear in search results and suggestions.</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.allowDiscovery" (ngModelChange)="onToggleChange('allowDiscovery', $event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Account -->
        <div class="settings-section" *ngIf="activeSection === 'account'">
          <h3>Account</h3>
          <p class="section-description">Update your username and email address.</p>

          <div class="setting-item" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
            <div class="setting-info">
              <label>Username</label>
              <p>Current: <strong>{{ currentUser?.username }}</strong></p>
            </div>
            <div class="setting-control" style="width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 0.75rem;">
              <input type="text" [(ngModel)]="newUsername" placeholder="New username" class="settings-input" />
              <div style="position: relative; display: flex; align-items: center; width: 100%;">
                <input [type]="showUsernamePassword ? 'text' : 'password'" [(ngModel)]="usernamePassword" placeholder="Current password" class="settings-input" style="padding-right: 2.5rem; width: 100%;" />
                <button type="button" (click)="showUsernamePassword = !showUsernamePassword"
                        style="position: absolute; right: 0.75rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 0;">
                  <svg *ngIf="showUsernamePassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  <svg *ngIf="!showUsernamePassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
              <button class="btn-primary" [disabled]="!newUsername || newUsername.length < 3 || !usernamePassword || usernameLoading" (click)="changeUsername()">{{ usernameLoading ? 'Updating...' : 'Update Username' }}</button>
              <div *ngIf="usernameError" class="error-msg">{{ usernameError }}</div>
            </div>
          </div>

          <div class="setting-item" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
            <div class="setting-info" style="width: 100%;">
              <label>Email</label>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <p style="margin: 0;">Current: <strong>{{ currentUser?.email || 'Not set' }}</strong></p>
                <span *ngIf="currentUser?.email" 
                      [ngClass]="currentUser?.emailVerified ? 'badge-success' : 'badge-danger'" 
                      style="font-size: 0.75rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700; text-transform: uppercase;">
                  {{ currentUser?.emailVerified ? 'Verified' : 'Unverified' }}
                </span>
              </div>
              <p>Current email is used for account-related notifications.</p>
              <div *ngIf="currentUser && currentUser.email && !currentUser.emailVerified" style="margin-top: 0.75rem;">
                <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 0.75rem; text-transform: none; letter-spacing: normal;" 
                        [disabled]="resendLoading" (click)="resendVerificationEmail()">
                  {{ resendLoading ? 'Sending link...' : 'Verify Email' }}
                </button>
              </div>
            </div>
            <div class="setting-control" style="width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 0.75rem;">
              <input type="email" [(ngModel)]="newEmail" placeholder="New email address" class="settings-input" />
              <div style="position: relative; display: flex; align-items: center; width: 100%;">
                <input [type]="showEmailPassword ? 'text' : 'password'" [(ngModel)]="emailPassword" placeholder="Current password" class="settings-input" style="padding-right: 2.5rem; width: 100%;" />
                <button type="button" (click)="showEmailPassword = !showEmailPassword"
                        style="position: absolute; right: 0.75rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 0;">
                  <svg *ngIf="showEmailPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  <svg *ngIf="!showEmailPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
              <button class="btn-primary" [disabled]="!newEmail || !emailPassword || emailLoading" (click)="changeEmail()">{{ emailLoading ? 'Updating...' : 'Update Email' }}</button>
              <div *ngIf="emailError" class="error-msg">{{ emailError }}</div>
            </div>
          </div>
        </div>

        <!-- Security -->
        <div class="settings-section" *ngIf="activeSection === 'security'">
          <h3>Security</h3>
          <p class="section-description">Manage your password and account access.</p>

          <div class="setting-item" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
            <div class="setting-info">
              <label>Change Password</label>
            </div>
            <div class="setting-control" style="width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="position: relative; display: flex; align-items: center; width: 100%;">
                <input [type]="showCurrentPassword ? 'text' : 'password'" [(ngModel)]="currentPassword" placeholder="Current Password" class="settings-input" style="padding-right: 2.5rem; width: 100%;" />
                <button type="button" (click)="showCurrentPassword = !showCurrentPassword"
                        style="position: absolute; right: 0.75rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 0;">
                  <svg *ngIf="showCurrentPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  <svg *ngIf="!showCurrentPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>

              <div style="position: relative; display: flex; align-items: center; width: 100%;">
                <input [type]="showNewPassword ? 'text' : 'password'" [(ngModel)]="newPassword" placeholder="New Password" class="settings-input" style="padding-right: 2.5rem; width: 100%;" />
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
              <small *ngIf="newPassword && !PASSWORD_PATTERN.test(newPassword)" style="color: #e74c3c; font-size: 0.8rem; display: block; margin-top: -0.25rem;">
                Password must be 8-100 characters and contain at least one uppercase, lowercase, digit, and special character (&#64;$!%*?&._#-).
              </small>

              <div style="position: relative; display: flex; align-items: center; width: 100%;">
                <input [type]="showConfirmPassword ? 'text' : 'password'" [(ngModel)]="confirmPassword" placeholder="Confirm New Password" class="settings-input" style="padding-right: 2.5rem; width: 100%;" />
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
              <small *ngIf="confirmPassword && newPassword !== confirmPassword" style="color: #e74c3c; font-size: 0.8rem; display: block; margin-top: -0.25rem;">
                Passwords do not match.
              </small>

              <button class="btn-primary" [disabled]="!canChangePassword() || passwordLoading" (click)="changePassword()">{{ passwordLoading ? 'Updating...' : 'Update Password' }}</button>
              <div *ngIf="passwordError" class="error-msg">{{ passwordError }}</div>
            </div>
          </div>

          <div class="setting-item" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
            <div class="setting-info">
              <label>Two-Factor Authentication (2FA)</label>
              <p>Protect your account with an extra layer of security using an authenticator app.</p>
            </div>
            
            <div class="setting-control" style="width: 100%; max-width: 400px;">
              <div *ngIf="!currentUser?.isTotpEnabled && !is2faSetup">
                <button class="btn-primary" (click)="start2faSetup()">Enable 2FA</button>
              </div>

              <div *ngIf="is2faSetup && !currentUser?.isTotpEnabled" style="display: flex; flex-direction: column; gap: 1rem; background: var(--bg-main); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
                <p style="margin: 0; font-size: 0.9rem;">Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy).</p>
                <img *ngIf="qrCodeImage" [src]="qrCodeImage" alt="QR Code" style="width: 200px; height: 200px; align-self: center;" />
                <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted); text-align: center;">Secret: {{ totpSecret }}</p>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <input type="text" [(ngModel)]="totpCode" placeholder="Enter 6-digit code" class="settings-input" maxlength="6" />
                  <button class="btn-primary" [disabled]="totpCode.length !== 6" (click)="enable2fa()">Verify & Enable</button>
                  <button class="btn-danger" (click)="is2faSetup = false">Cancel</button>
                  <div *ngIf="twoFactorError" class="error-msg">{{ twoFactorError }}</div>
                </div>
              </div>

              <div *ngIf="currentUser?.isTotpEnabled" style="display: flex; flex-direction: column; gap: 1rem;">
                <p style="margin: 0; font-size: 0.9rem; color: var(--success); font-weight: 600;">2FA is currently enabled.</p>
                <div style="display: flex; gap: 0.5rem;">
                  <input type="text" [(ngModel)]="totpCode" placeholder="Enter 6-digit code to disable" class="settings-input" maxlength="6" style="flex: 1;" />
                  <button class="btn-danger" [disabled]="totpCode.length !== 6" (click)="disable2fa()">Disable</button>
                </div>
                <div *ngIf="twoFactorError" class="error-msg">{{ twoFactorError }}</div>
              </div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Log Out</label>
              <p>Sign out of your account on this device.</p>
            </div>
            <div class="setting-control">
              <button class="btn-danger" (click)="logout()">Log Out</button>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="settings-section" *ngIf="activeSection === 'about'">
          <h3>About</h3>
          <p class="section-description">Application information and legal documents.</p>

          <div class="setting-item">
            <div class="setting-info">
              <label>Version</label>
              <p>Current application version.</p>
            </div>
            <div class="setting-control">
              <span class="version-label">v1.0.0</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Build</label>
              <p>Build information.</p>
            </div>
            <div class="setting-control">
              <span class="version-label">2026.1</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Privacy Policy</label>
              <p>How we handle your data.</p>
            </div>
            <div class="setting-control">
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" class="legal-link">Read</a>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Terms &amp; Conditions</label>
              <p>Rules for using the platform.</p>
            </div>
            <div class="setting-control">
              <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" class="legal-link">Read</a>
            </div>
          </div>
        </div>

        <div class="save-status" *ngIf="saveStatus">
          {{ saveStatus }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 900px;
      margin: 2rem auto;
      padding: 0 1rem;
      display: flex;
      gap: 3rem;
      align-items: flex-start;
    }

    .settings-sidebar {
      flex: 0 0 250px;
    }

    .settings-sidebar h2 {
      margin: 0 0 1.5rem;
      font-size: 1.5rem;
      color: var(--text-main);
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .settings-nav button {
      background: none;
      border: none;
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-muted);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .settings-nav button:hover {
      background: var(--bg-hover);
      color: var(--text-main);
    }

    .settings-nav button.active {
      background: var(--text-main);
      color: var(--bg-main);
    }

    .settings-loading { text-align: center; color: var(--text-muted); padding: 3rem 1rem; font-size: 1rem; }
    .settings-content {
      flex: 1;
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2.5rem;
      min-height: 400px;
    }

    .settings-section h3 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      color: var(--text-main);
      font-weight: 800;
    }

    .section-description {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin: 0 0 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .setting-item:last-child {
      border-bottom: none;
    }

    .setting-info label {
      display: block;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.25rem;
      font-size: 0.95rem;
    }

    .setting-info p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .setting-control select {
      padding: 0.6rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-main);
      color: var(--text-main);
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
    }

    .setting-control select:focus {
      outline: none;
      border-color: var(--text-main);
    }

    .version-label {
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .legal-link {
      color: var(--accent-color);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .legal-link:hover {
      text-decoration: underline;
    }

    .settings-input {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: inherit;
      background: var(--bg-main);
      color: var(--text-main);
    }
    
    .settings-input:focus {
      outline: none;
      border-color: var(--text-main);
    }

    .btn-primary {
      padding: 0.75rem 1rem;
      background: var(--text-main);
      color: var(--bg-main);
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-danger {
      padding: 0.75rem 1rem;
      background: var(--danger);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-danger:hover {
      background: #dc2626;
    }

    .error-msg {
      color: var(--danger);
      font-size: 0.85rem;
      font-weight: 600;
    }

    /* Toggle Switch Styles */
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: var(--border-color);
      transition: .2s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .2s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    input:checked + .slider {
      background-color: var(--text-main);
    }

    input:checked + .slider:before {
      transform: translateX(20px);
    }

    .save-status {
      margin-top: 2rem;
      padding: 1rem;
      background: #dcfce7;
      color: #166534;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      text-align: center;
      animation: fadeOut 3s forwards;
    }

    @keyframes fadeOut {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }

    .badge-success { background-color: #27ae60; color: white; }
    .badge-danger { background-color: #e74c3c; color: white; }

    @media (max-width: 767px) {
      .settings-container { flex-direction: column; gap: 1.5rem; margin: 1rem auto; }
      .settings-sidebar { flex: none; width: 100%; }
      .settings-sidebar h2 { margin-bottom: 1rem; font-size: 1.25rem; }
      .settings-nav { flex-direction: row; flex-wrap: wrap; gap: 0.35rem; }
      .settings-nav button { flex: 1; min-width: 100px; text-align: center; font-size: 0.85rem; padding: 0.6rem 0.5rem; }
      .settings-content { padding: 1.25rem; min-height: auto; }
      .settings-section h3 { font-size: 1.1rem; }
      .setting-item { flex-direction: column; align-items: flex-start; gap: 0.5rem; padding: 1rem 0; }
      .setting-control { width: 100%; }
      .setting-control select { width: 100%; }
    }
    @media (min-width: 768px) and (max-width: 1023px) {
      .settings-container { gap: 2rem; }
      .settings-content { padding: 1.5rem; }
    }
  `]
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  activeSection: 'appearance' | 'notifications' | 'privacy' | 'account' | 'security' | 'about' = 'appearance';
  settings: UserSettingsResponse | null = null;
  settingsLoading = true;
  saveStatus = '';
  private saveTimeout: any;
  isAnonymousMode = false;

  newUsername = '';
  usernamePassword = '';
  usernameError = '';
  usernameLoading = false;

  newEmail = '';
  emailPassword = '';
  emailError = '';
  emailLoading = false;
  resendLoading = false;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordLoading = false;

  showUsernamePassword = false;
  showEmailPassword = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._#\-]).{8,100}$/;

  currentUser: any = null;
  is2faSetup = false;
  qrCodeImage = '';
  totpSecret = '';
  totpCode = '';
  twoFactorError = '';

  private accentColor$ = new Subject<string>();
  private accentSub: Subscription;
  constructor(
    private settingsService: SettingsService,
    private authService: AuthService,
    private anonymousBrowsingService: AnonymousBrowsingService,
    private router: Router,
    private themeService: ThemeService,
    private toastService: ToastService
  ) {
    this.accentSub = this.accentColor$.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(color => {
      this.saveSingleSetting('accentColor', color);
    });
  }

  ngOnDestroy(): void {
    this.accentSub.unsubscribe();
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
  }

  ngOnInit(): void {
    this.authService.checkAuth().subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      this.currentUser = user;
      this.loadSettings();
    });
  }

  loadSettings(): void {
    this.settingsLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        this.settings = res;
        this.isAnonymousMode = res.anonymousBrowsing;
        this.anonymousBrowsingService.setAnonymousMode(res.anonymousBrowsing);
        this.applySettingsToUI(res);
        this.settingsLoading = false;
      },
      error: () => {
        this.settingsLoading = false;
        this.toastService.showError('Failed to load settings. Please try again.');
      }
    });
  }

  private applySettingsToUI(s: UserSettingsResponse): void {
    this.themeService.applyTheme(s.theme);
    if (s.accentColor) {
      document.documentElement.style.setProperty('--primary', s.accentColor);
      const r = parseInt(s.accentColor.slice(1, 3), 16);
      const g = parseInt(s.accentColor.slice(3, 5), 16);
      const b = parseInt(s.accentColor.slice(5, 7), 16);
      document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    }
  }

  saveSingleSetting(key: string, value: any): void {
    if (!this.settings) return;
    const previous = (this.settings as any)[key];
    this.settingsService.updateSettings({ [key]: value }).subscribe({
      next: () => this.showSavedStatus(),
      error: () => {
        (this.settings as any)[key] = previous;
        this.toastService.showError(`Could not save ${key}.`);
      }
    });
  }

  onAccentInput(color: string): void {
    if (!color) return;
    this.previewAccentColor(color);
    this.accentColor$.next(color);
  }

  previewAccentColor(color: string): void {
    if (!color) return;
    document.documentElement.style.setProperty('--primary', color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
  }

  onToggleChange(key: string, value: boolean): void {
    this.saveSingleSetting(key, value);
  }

  onThemeChange(): void {
    if (!this.settings) return;
    this.themeService.applyTheme(this.settings.theme);
    this.saveSingleSetting('theme', this.settings.theme);
  }

  showSavedStatus(): void {
    this.saveStatus = 'Settings saved.';
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveStatus = '';
    }, 3000);
  }

  toggleAnonymousMode(enabled: boolean): void {
    if (!this.settings) return;
    const previous = this.settings.anonymousBrowsing;
    this.isAnonymousMode = enabled;
    this.settings.anonymousBrowsing = enabled;
    this.anonymousBrowsingService.setAnonymousMode(enabled);
    this.settingsService.updateSettings({ anonymousBrowsing: enabled }).subscribe({
      next: () => this.showSavedStatus(),
      error: () => {
        this.settings!.anonymousBrowsing = previous;
        this.isAnonymousMode = previous;
        this.anonymousBrowsingService.setAnonymousMode(previous);
        this.toastService.showError('Could not save anonymous browsing setting.');
      }
    });
  }

  canChangePassword(): boolean {
    return this.currentPassword.length > 0 && 
           this.PASSWORD_PATTERN.test(this.newPassword) && 
           this.newPassword === this.confirmPassword;
  }

  changePassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match.';
      return;
    }
    if (!this.canChangePassword()) return;

    this.passwordLoading = true;
    this.passwordError = '';
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.passwordError = '';
        this.passwordLoading = false;
        this.toastService.showSuccess('Password changed.');
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.passwordError = 'Current password is incorrect.';
        } else if (err.status === 400) {
          this.passwordError = err?.error?.message ?? 'New password does not meet requirements.';
        } else {
          this.passwordError = 'Could not update password. Please try again.';
        }
        this.passwordLoading = false;
      }
    });
  }

  changeUsername(): void {
    if (!this.newUsername || this.newUsername.length < 3 || !this.usernamePassword) return;

    this.usernameLoading = true;
    this.usernameError = '';
    this.authService.changeUsername(this.usernamePassword, this.newUsername).subscribe({
      next: () => {
        if (this.currentUser) this.currentUser.username = this.newUsername;
        this.newUsername = '';
        this.usernamePassword = '';
        this.usernameLoading = false;
        this.toastService.showSuccess('Username updated.');
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.usernameError = 'Current password is incorrect.';
        } else if (err.status === 400) {
          this.usernameError = err?.error?.message ?? 'Username is invalid or taken.';
        } else {
          this.usernameError = 'Could not update username. Please try again.';
        }
        this.usernameLoading = false;
      }
    });
  }

  changeEmail(): void {
    if (!this.newEmail || !this.emailPassword) return;

    this.emailLoading = true;
    this.emailError = '';
    this.authService.changeEmail(this.emailPassword, this.newEmail).subscribe({
      next: () => {
        this.newEmail = '';
        this.emailPassword = '';
        this.emailLoading = false;
        this.toastService.showSuccess('Email updated.');
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.emailError = 'Current password is incorrect.';
        } else if (err.status === 400) {
          this.emailError = err?.error?.message ?? 'Email is invalid or already registered.';
        } else {
          this.emailError = 'Could not update email. Please try again.';
        }
        this.emailLoading = false;
      }
    });
  }

  resendVerificationEmail(): void {
    this.resendLoading = true;
    this.authService.resendVerification().subscribe({
      next: () => {
        this.resendLoading = false;
        this.toastService.showSuccess('Verification link sent to your email.');
      },
      error: (err) => {
        this.resendLoading = false;
        this.toastService.showError(err?.error?.message || 'Failed to send verification link.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  start2faSetup(): void {
    this.twoFactorError = '';
    this.authService.generate2fa().subscribe({
      next: (res) => {
        this.qrCodeImage = res.qrCodeImage;
        this.totpSecret = res.secret;
        this.is2faSetup = true;
      },
      error: () => this.twoFactorError = 'Failed to generate 2FA secret.'
    });
  }

  enable2fa(): void {
    this.twoFactorError = '';
    this.authService.enable2fa(this.totpCode, this.totpSecret).subscribe({
      next: () => {
        if (this.currentUser) this.currentUser.isTotpEnabled = true;
        this.is2faSetup = false;
        this.totpCode = '';
        this.saveStatus = '2FA enabled successfully.';
        this.showSavedStatus();
      },
      error: () => this.twoFactorError = 'Invalid code. Please try again.'
    });
  }

  disable2fa(): void {
    this.twoFactorError = '';
    this.authService.disable2fa(this.totpCode).subscribe({
      next: () => {
        if (this.currentUser) this.currentUser.isTotpEnabled = false;
        this.totpCode = '';
        this.saveStatus = '2FA disabled successfully.';
        this.showSavedStatus();
      },
      error: () => this.twoFactorError = 'Invalid code. Please try again.'
    });
  }
}
