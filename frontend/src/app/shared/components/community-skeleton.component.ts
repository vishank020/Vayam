import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-community-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="community-skeleton">
      <div class="skeleton skeleton-text-sm" style="width: 160px; margin-bottom: 1rem;"></div>
      <div class="skeleton skeleton-banner"></div>
      <div class="community-header">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="skeleton skeleton-avatar-md"></div>
          <div>
            <div class="skeleton skeleton-text-lg" style="width: 180px;"></div>
            <div class="skeleton skeleton-text-sm" style="width: 120px;"></div>
            <div class="skeleton skeleton-text-sm" style="width: 100px; margin-top: 0.3rem;"></div>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <div class="skeleton skeleton-action-pill" style="width: 60px;"></div>
          <div class="skeleton skeleton-action-pill" style="width: 110px;"></div>
        </div>
      </div>
      <div class="skeleton skeleton-text" style="width: 70%; margin-top: 0.5rem;"></div>
      <div class="skeleton skeleton-text-sm" style="width: 40%;"></div>
      <div class="skeleton-tabs">
        <div class="skeleton skeleton-text" style="width: 50px; height: 1rem;"></div>
        <div class="skeleton skeleton-text" style="width: 60px; height: 1rem;"></div>
        <div class="skeleton skeleton-text" style="width: 70px; height: 1rem;"></div>
      </div>
      <div class="post-type-filters">
        <div class="skeleton skeleton-action-pill" style="width: 50px;"></div>
        <div class="skeleton skeleton-action-pill" style="width: 70px;"></div>
        <div class="skeleton skeleton-action-pill" style="width: 90px;"></div>
        <div class="skeleton skeleton-action-pill" style="width: 60px;"></div>
        <div class="skeleton skeleton-action-pill" style="width: 50px;"></div>
      </div>
      <div class="post-skeleton-item" *ngFor="let _ of [].constructor(3); let i = index" [style.animation-delay]="(i % 3) * 0.08 + 's'">
        <div class="skeleton-meta">
          <div class="skeleton skeleton-round" style="width: 40px; height: 40px;"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton-text-sm" style="width: 40%;"></div>
            <div class="skeleton skeleton-text" style="width: 25%; height: 0.7rem;"></div>
          </div>
          <div class="skeleton skeleton-action-pill"></div>
        </div>
        <div class="skeleton skeleton-text-lg" style="width: 60%; margin-bottom: 0.75rem;"></div>
        <div class="skeleton skeleton-text" style="width: 90%;"></div>
        <div class="skeleton skeleton-text" style="width: 70%;"></div>
        <div class="skeleton skeleton-action-bar">
          <div class="skeleton skeleton-action-pill"></div>
          <div class="skeleton skeleton-action-pill"></div>
          <div class="skeleton skeleton-action-pill"></div>
          <div class="skeleton skeleton-action-pill" style="width: 80px;"></div>
          <div class="skeleton skeleton-action-pill" style="width: 80px;"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .community-skeleton {
      max-width: 780px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .community-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .skeleton-tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border-color);
      margin: 1rem 0;
      padding-bottom: 0.6rem;
      gap: 2rem;
    }
    .post-type-filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .post-skeleton-item {
      padding: 2rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .skeleton-meta {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .skeleton-action-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    @media (max-width: 767px) {
      .community-skeleton { margin: 1rem auto; }
      .community-header { flex-direction: column; }
      .post-skeleton-item { padding: 1.25rem 0; }
    }
  `]
})
export class CommunitySkeletonComponent {}
