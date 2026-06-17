import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-skeleton">
      <div class="skeleton-sidebar">
        <div class="skeleton skeleton-text-lg" style="width: 80px; margin-bottom: 1.5rem;"></div>
        <div class="skeleton skeleton-text" style="width: 100px; margin-bottom: 0.75rem;"></div>
        <div class="skeleton skeleton-text" style="width: 120px; margin-bottom: 0.75rem;"></div>
        <div class="skeleton skeleton-text" style="width: 90px; margin-bottom: 0.75rem;"></div>
        <div class="skeleton skeleton-text" style="width: 80px; margin-bottom: 0.75rem;"></div>
        <div class="skeleton skeleton-text" style="width: 60px;"></div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-text-lg" style="width: 140px; margin-bottom: 0.5rem;"></div>
        <div class="skeleton skeleton-text" style="width: 280px; margin-bottom: 1.5rem;"></div>
        <div class="setting-row" *ngFor="let _ of [].constructor(4); let i = index" [style.animation-delay]="(i % 4) * 0.05 + 's'">
          <div style="flex: 1;">
            <div class="skeleton skeleton-text" style="width: 120px;"></div>
            <div class="skeleton skeleton-text-sm" style="width: 200px;"></div>
          </div>
          <div class="skeleton" style="width: 48px; height: 24px; border-radius: 12px; flex-shrink: 0;"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-skeleton {
      display: flex;
      gap: 2rem;
      max-width: 780px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .skeleton-sidebar {
      width: 180px;
      flex-shrink: 0;
    }
    .skeleton-content {
      flex: 1;
    }
    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    @media (max-width: 767px) {
      .settings-skeleton { flex-direction: column; padding: 1rem 0.75rem; }
      .skeleton-sidebar { width: 100%; }
    }
  `]
})
export class SettingsSkeletonComponent {}
