import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterOutlet, NavigationEnd, Router, ActivatedRoute } from '@angular/router';
import { AppHeaderComponent } from './app-header/app-header.component';
import { AppSidebarComponent } from './app-sidebar/app-sidebar.component';
import { ToastContainerComponent } from './shared/toast-container/toast-container.component';
import { BottomNavComponent } from './shared/bottom-nav/bottom-nav.component';
import { AnonymousExitModalComponent } from './shared/anonymous-exit-modal/anonymous-exit-modal.component';
import { AuthService } from './core/auth.service';
import { SettingsService } from './core/settings.service';
import { SidebarService } from './core/sidebar.service';
import { ThemeService } from './core/theme.service';
import { SeoService } from './core/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AppHeaderComponent, AppSidebarComponent, ToastContainerComponent, AnonymousExitModalComponent, BottomNavComponent],
  template: `
    <app-header></app-header>
    <div class="app-layout" [class.sidebar-open]="sidebarOpen">
      <app-sidebar [open]="sidebarOpen"></app-sidebar>
      <main class="main-content" (click)="onMainClick()">
        <router-outlet></router-outlet>
      </main>
    </div>
    <div class="sidebar-backdrop" *ngIf="sidebarOpen" (click)="closeSidebar()"></div>
    <app-toast-container></app-toast-container>
    <app-anonymous-exit-modal></app-anonymous-exit-modal>
    <app-bottom-nav></app-bottom-nav>
  `,
  styles: [`
    :host { display: block; }
    .app-layout {
      display: flex;
      margin-top: var(--header-height);
    }
    .main-content {
      flex: 1;
      margin-left: var(--sidebar-width);
      min-height: calc(100vh - var(--header-height));
      padding: 1.5rem;
      background-color: var(--bg-main);
      transition: margin-left 0.2s ease;
    }
    .sidebar-backdrop {
      display: none;
    }
    @media (max-width: 1023px) {
      .main-content {
        margin-left: 0;
        padding: 1rem;
      }
    }
    @media (max-width: 767px) {
      .main-content {
        padding: 0.75rem;
      }
    }
    @media (max-width: 1023px) {
      .sidebar-backdrop {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1050;
      }
    }
    @media (max-width: 768px) {
      .main-content {
        padding-bottom: calc(56px + env(safe-area-inset-bottom));
      }
    }
    @media (min-width: 1024px) {
      .sidebar-backdrop {
        display: none !important;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  sidebarOpen = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private settingsService: SettingsService,
    private sidebarService: SidebarService,
    private router: Router,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private themeService: ThemeService
  ) {
    this.sidebarService.open$.subscribe(open => {
      this.sidebarOpen = open;
    });
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.closeSidebar();
        this.updateSeoFromRoute();
      }
    });
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  private updateSeoFromRoute(): void {
    let activated = this.route;
    while (activated.firstChild) {
      activated = activated.firstChild;
    }
    const data = activated.snapshot.data;
    if (data['title'] && data['description']) {
      this.seoService.updateMeta(data['title'], data['description']);
    }
  }

  onMainClick(): void {
    if (this.sidebarOpen && window.innerWidth < 1024) {
      this.closeSidebar();
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.settingsService.getSettings().subscribe({
            next: (settings) => {
              this.themeService.applyTheme(settings.theme);
              if (settings.accentColor) {
                document.documentElement.style.setProperty('--primary', settings.accentColor);
                const r = parseInt(settings.accentColor.slice(1, 3), 16);
                const g = parseInt(settings.accentColor.slice(3, 5), 16);
                const b = parseInt(settings.accentColor.slice(5, 7), 16);
                document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
              }
            }
          });
        } else {
          const savedTheme = localStorage.getItem('cc-theme');
          this.themeService.applyTheme(savedTheme === 'light' ? 'light' : 'dark');
          document.documentElement.style.removeProperty('--primary');
        }
      });
    }
  }
}
