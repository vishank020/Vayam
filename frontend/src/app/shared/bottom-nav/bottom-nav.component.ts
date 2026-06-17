import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../core/sidebar.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/feed" routerLinkActive="active" class="nav-tab" aria-label="Feed">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span class="tab-label">Feed</span>
      </a>
      <a routerLink="/communities" routerLinkActive="active" class="nav-tab" aria-label="Communities">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span class="tab-label">Communities</span>
      </a>
      <a routerLink="/questions" routerLinkActive="active" class="nav-tab" aria-label="Q&A">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span class="tab-label">Q&A</span>
      </a>
      <a routerLink="/search" routerLinkActive="active" class="nav-tab" aria-label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span class="tab-label">Search</span>
      </a>
      <button class="nav-tab nav-tab--menu" (click)="openSidebar()" aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <span class="tab-label">Menu</span>
      </button>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 56px;
      padding-bottom: env(safe-area-inset-bottom);
      background: var(--bg-main);
      border-top: 1px solid var(--border-color);
      z-index: 1001;
      display: flex;
      justify-content: space-around;
      align-items: center;
      box-sizing: content-box;
    }
    .nav-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      min-width: 44px;
      min-height: 44px;
      color: var(--text-muted);
      text-decoration: none;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      font-family: inherit;
      transition: color 0.15s;
    }
    .nav-tab.active {
      color: var(--accent-color);
    }
    .nav-tab:hover {
      color: var(--text-main);
    }
    .nav-tab svg {
      display: block;
    }
    .tab-label {
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      line-height: 1;
    }
    @media (min-width: 1024px) {
      .bottom-nav {
        display: none;
      }
    }
    @media (max-width: 479px) {
      .tab-label {
        display: none;
      }
      .nav-tab {
        min-width: 48px;
      }
    }
  `]
})
export class BottomNavComponent {
  constructor(private sidebarService: SidebarService) {}

  openSidebar(): void {
    this.sidebarService.toggle();
  }
}
