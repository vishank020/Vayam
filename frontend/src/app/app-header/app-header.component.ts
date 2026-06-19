import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { UserResponse } from '../core/user.service';
import { AnonymousBrowsingService } from '../core/anonymous-browsing.service';
import { NotificationBellComponent } from '../features/notification/notification-bell/notification-bell.component';
import { SidebarService } from '../core/sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NotificationBellComponent],
  template: `
    <div class="anon-banner" *ngIf="isAnonymousMode">
      <div class="anon-banner-content">
        <span>👤 Anonymous Browsing Active</span>
        <button class="btn-disable-anon" (click)="toggleAnonymousMode()">Disable</button>
      </div>
    </div>
    <header class="navbar" [class.has-banner]="isAnonymousMode">
      <div class="navbar-left">
        <button class="hamburger" (click)="toggleSidebar()" aria-label="Toggle navigation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <a routerLink="/" class="logo">Vayam</a>
      </div>

      <div class="navbar-center">
        <div class="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search posts, communities, users..." 
            [(ngModel)]="searchQuery" 
            (keyup.enter)="onSearch()"
          />
        </div>
      </div>

      <div class="navbar-right">
        <ng-container *ngIf="authService.currentUser$ | async as user; else unauth">
          <button class="btn-create-post" (click)="onCreatePostClick()" aria-label="Create Post">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Create Post</span>
          </button>

          <app-notification-bell></app-notification-bell>

          <div class="avatar-container" (click)="toggleDropdown($event)">
            <ng-container *ngIf="isAnonymousMode; else normalAvatar">
              <div class="avatar-circle anon-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </ng-container>
            <ng-template #normalAvatar>
              <img *ngIf="user.avatarUrl" [src]="user.avatarUrl" class="avatar-img" alt="User Avatar" />
              <div *ngIf="!user.avatarUrl" class="avatar-circle">
                {{ getInitials(user.displayName || user.username) }}
              </div>
            </ng-template>
            
            <div class="dropdown-menu" *ngIf="dropdownOpen">
              <a routerLink="/profile" class="dropdown-item">Profile</a>
              <a routerLink="/settings" class="dropdown-item">Settings</a>
              <a routerLink="/drafts" class="dropdown-item">Drafts</a>
              <div class="dropdown-item" (click)="toggleAnonymousMode()">
                {{ isAnonymousMode ? 'Disable Anonymous' : 'Enable Anonymous' }}
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item text-danger" (click)="logout()">Logout</div>
            </div>
          </div>
        </ng-container>

        <ng-template #unauth>
          <a routerLink="/login" class="nav-link">Sign In</a>
          <a routerLink="/register" class="btn-primary">Sign Up</a>
        </ng-template>
      </div>
    </header>
  `,
  styles: [`
    .anon-banner {
      width: 100%;
      background-color: var(--text-main);
      color: var(--bg-main);
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      justify-content: center;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1001;
    }
    .anon-banner-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.4rem 1rem;
    }
    .btn-disable-anon {
      background: transparent;
      border: 1px solid var(--bg-main);
      color: var(--bg-main);
      border-radius: 4px;
      padding: 0.15rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      text-transform: uppercase;
    }
    .btn-disable-anon:hover {
      background: var(--bg-main);
      color: var(--text-main);
    }
    .navbar {
      height: 60px;
      width: 100%;
      position: fixed;
      top: 0;
      left: 0;
      background-color: var(--bg-main);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      z-index: 1000;
      transition: top 0.2s;
    }
    .navbar.has-banner {
      top: 30px;
    }

    .navbar-left, .navbar-right {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .navbar-right {
      justify-content: flex-end;
      gap: 1.5rem;
    }

    .navbar-center {
      flex: 2;
      display: flex;
      justify-content: center;
    }

    .hamburger {
      display: none;
      background: none;
      border: none;
      color: var(--text-main);
      cursor: pointer;
      padding: 0.4rem;
      margin-right: 0.5rem;
      align-items: center;
      justify-content: center;
    }
    .hamburger:hover {
      opacity: 0.7;
    }

    .logo {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text-main);
      text-decoration: none;
      text-transform: uppercase;
    }

    .search-bar {
      display: flex;
      align-items: center;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0.4rem 1rem;
      width: 100%;
      max-width: 400px;
      transition: border-color 0.2s;
    }

    .search-bar:focus-within {
      border-color: var(--text-main);
    }

    .search-bar svg {
      color: var(--text-muted);
      margin-right: 0.5rem;
    }

    .search-bar input {
      background: transparent;
      border: none;
      color: var(--text-main);
      width: 100%;
      font-size: 0.9rem;
      outline: none;
      font-family: inherit;
    }

    .search-bar input::placeholder {
      color: var(--text-muted);
    }

    .btn-create-post {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background-color: transparent;
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: all 0.2s;
      cursor: pointer;
    }

    .btn-create-post:hover {
      border-color: var(--text-main);
      background-color: var(--text-main);
      color: var(--bg-main);
    }

    .btn-primary {
      background-color: var(--text-main);
      color: var(--bg-main);
      padding: 0.4rem 1rem;
      font-size: 0.85rem;
      font-weight: 700;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid var(--text-main);
      transition: opacity 0.2s;
    }

    .btn-primary:hover {
      opacity: 0.8;
    }

    .nav-link {
      color: var(--text-main);
      font-weight: 600;
      text-decoration: none;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .nav-link:hover { opacity: 0.7; }

    .avatar-container {
      position: relative;
      cursor: pointer;
    }

    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--text-main);
      color: var(--bg-main);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      object-fit: cover;
    }

    .avatar-img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }

    .anon-avatar {
      background-color: var(--text-muted);
      color: var(--bg-main);
    }

    .dropdown-menu {
      position: absolute;
      top: 45px;
      right: 0;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      min-width: 150px;
      display: flex;
      flex-direction: column;
      z-index: 1000;
    }

    .dropdown-item {
      padding: 0.75rem 1rem;
      color: var(--text-main);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: block;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .dropdown-item:hover {
      background-color: var(--text-main);
      color: var(--bg-main);
    }

    .dropdown-divider {
      height: 1px;
      background-color: var(--border-color);
    }

    .text-danger {
      color: var(--danger);
    }
    .text-danger:hover {
      background-color: var(--danger);
      color: white;
    }

    @media (max-width: 1023px) {
      .hamburger { display: inline-flex; }
      .navbar { padding: 0 0.75rem; }
      .navbar-center { flex: 0; }
      .search-bar { max-width: 220px; }
      .navbar-right { gap: 0.75rem; }
      .btn-create-post span { display: none; }
    }

    @media (max-width: 768px) {
      .search-bar { display: none; }
      .navbar-center { flex: 0; }
      .btn-create-post {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        padding: 0;
        justify-content: center;
        border: none;
      }
    }
    @media (max-width: 767px) {
      .navbar-right { gap: 0.5rem; }
    }

    @media (max-width: 480px) {
      .search-bar { max-width: 120px; }
      .search-bar input { width: 80px; }
    }
  `]
})
export class AppHeaderComponent implements OnInit {
  loading = true;
  dropdownOpen = false;
  searchQuery = '';
  isAnonymousMode = false;

  constructor(
    public authService: AuthService,
    private anonymousBrowsingService: AnonymousBrowsingService,
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    // Initial fetch if not already done by something else
    this.authService.checkAuth().subscribe();

    this.anonymousBrowsingService.isAnonymousMode$.subscribe(isAnon => {
      this.isAnonymousMode = isAnon;
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.avatar-container')) {
      this.dropdownOpen = false;
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
      this.searchQuery = '';
    }
  }

  toggleAnonymousMode() {
    this.anonymousBrowsingService.toggleAnonymousMode();
    this.dropdownOpen = false;
  }

  onCreatePostClick() {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    this.router.navigate(['/posts/new']);
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  logout(): void {
    this.dropdownOpen = false;
    this.authService.logout();
  }
}
