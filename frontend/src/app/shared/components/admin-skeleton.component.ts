import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-skeleton">
      <div class="skeleton skeleton-text-lg" style="width: 120px; margin-bottom: 1rem;"></div>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        <div class="skeleton" style="width: 60px; height: 32px; border-radius: 6px;"></div>
        <div class="skeleton" style="width: 70px; height: 32px; border-radius: 6px;"></div>
      </div>
      <div class="skeleton-table">
        <div class="skeleton-table-header">
          <div class="skeleton skeleton-text-sm" style="width: 60px;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 80px;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 120px;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 100px;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 80px;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 70px;"></div>
        </div>
        <div class="skeleton-table-row" *ngFor="let _ of [].constructor(5); let i = index" [style.animation-delay]="(i % 5) * 0.05 + 's'">
          <div class="skeleton skeleton-text-sm" style="width: 50px;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 60px;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 100px;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 80px;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 60px;"></div>
          <div class="skeleton" style="width: 70px; height: 28px; border-radius: 4px;"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-skeleton {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .skeleton-table {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
    }
    .skeleton-table-header {
      display: grid;
      grid-template-columns: 80px 100px 160px 140px 100px 100px;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border-color);
    }
    .skeleton-table-row {
      display: grid;
      grid-template-columns: 80px 100px 160px 140px 100px 100px;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      align-items: center;
    }
    .skeleton-table-row:last-child { border-bottom: none; }
  `]
})
export class AdminSkeletonComponent {}
