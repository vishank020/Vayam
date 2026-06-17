import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { SidebarService } from '../core/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.sidebar--open]="open">
      <nav class="sidebar-nav">
        <a routerLink="/feed" routerLinkActive="active" class="nav-item" (click)="onFeedClick($event); closeOnNav()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Feed
        </a>
        <a routerLink="/questions" routerLinkActive="active" class="nav-item" (click)="closeOnNav()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Q&A
        </a>
        <a routerLink="/communities" routerLinkActive="active" class="nav-item" (click)="closeOnNav()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Communities
        </a>
        <a routerLink="/dm" routerLinkActive="active" class="nav-item" (click)="closeOnNav()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          Messages
        </a>

        <div class="nav-divider"></div>

        <a routerLink="/settings" routerLinkActive="active" class="nav-item" (click)="closeOnNav()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          Settings
        </a>
        <ng-container *ngIf="authService.currentUser$ | async as user">
          <a routerLink="/profile" routerLinkActive="active" class="nav-item" (click)="closeOnNav()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Profile
          </a>
        </ng-container>

        <div class="nav-spacer"></div>

        <div class="legal-section">
          <a routerLink="/privacy-policy" class="legal-link">Privacy Policy</a>
          <a routerLink="/terms-and-conditions" class="legal-link">Terms &amp; Conditions</a>
          <span class="version">v1.0.0</span>
        </div>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: calc(100vh - var(--header-height));
      position: fixed;
      left: 0;
      top: var(--header-height);
      background-color: var(--bg-main);
      border-right: 1px solid var(--border-color);
      overflow-y: auto;
      z-index: 900;
      transition: transform 0.25s ease;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      padding: 1rem 0;
      min-height: calc(100% - 2rem);
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1.5rem;
      color: var(--text-main);
      text-decoration: none;
      font-size: 1rem;
      font-weight: 500;
      border-left: 4px solid transparent;
      transition: background-color 0.1s ease, border-color 0.1s ease, color 0.1s ease;
      gap: 1rem;
    }

    .nav-item:hover {
      background-color: var(--bg-elevated);
    }

    .nav-item.active {
      color: var(--accent-color);
      border-left-color: var(--accent-color);
      background-color: var(--bg-elevated);
    }

    .nav-item svg {
      opacity: 0.8;
    }

    .nav-item.active svg {
      opacity: 1;
      stroke: var(--accent-color);
    }

    .nav-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 1rem 1.5rem;
    }

    .nav-spacer {
      flex: 1;
    }

    .legal-section {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .legal-link {
      font-size: 0.82rem;
      color: var(--text-muted);
      text-decoration: none;
    }

    .legal-link:hover {
      color: var(--accent-color);
      text-decoration: underline;
    }

    .version {
      font-size: 0.72rem;
      color: var(--text-muted);
      opacity: 0.6;
      margin-top: 0.15rem;
    }

    @media (max-width: 1023px) {
      .sidebar {
        transform: translateX(-100%);
        z-index: 1100;
        box-shadow: 4px 0 20px rgba(0,0,0,0.2);
      }
      .sidebar--open {
        transform: translateX(0);
      }
    }
    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        max-width: 100%;
      }
    }
  `]
})
export class AppSidebarComponent {
  @Input() open = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  onFeedClick(event: Event) {
    if (this.router.url === '/feed' || this.router.url === '/') {
      event.preventDefault();
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/feed']);
      });
    }
  }

  closeOnNav() {
    this.sidebarService.close();
  }
}
