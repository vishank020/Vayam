import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-skeleton">
      <div class="skeleton-card">
        <div class="skeleton skeleton-banner"></div>
        <div class="skeleton-header-top">
          <div class="skeleton skeleton-avatar-lg"></div>
          <div style="display: flex; gap: 0.5rem; align-self: flex-start;">
            <div class="skeleton skeleton-action-pill"></div>
            <div class="skeleton skeleton-action-pill"></div>
            <div class="skeleton skeleton-action-pill"></div>
          </div>
        </div>
        <div class="skeleton-info">
          <div class="skeleton skeleton-text-lg" style="width: 200px;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 100px;"></div>
          <div class="skeleton skeleton-text" style="width: 300px; margin-top: 1rem;"></div>
          <div class="skeleton skeleton-text" style="width: 250px;"></div>
          <div class="skeleton-stats">
            <div class="skeleton skeleton-text" style="width: 80px;"></div>
            <div class="skeleton skeleton-text" style="width: 80px;"></div>
            <div class="skeleton skeleton-text" style="width: 80px;"></div>
            <div class="skeleton skeleton-text" style="width: 80px;"></div>
          </div>
        </div>
      </div>
      <div class="skeleton-tabs">
        <div class="skeleton skeleton-text" style="width: 60px; height: 1rem;"></div>
        <div class="skeleton skeleton-text" style="width: 80px; height: 1rem;"></div>
        <div class="skeleton skeleton-text" style="width: 70px; height: 1rem;"></div>
      </div>
      <div class="post-skeleton-item">
        <div class="skeleton-meta">
          <div class="skeleton skeleton-round" style="width: 36px; height: 36px;"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton-text-sm" style="width: 30%;"></div>
            <div class="skeleton skeleton-text" style="width: 20%; height: 0.7rem;"></div>
          </div>
        </div>
        <div class="skeleton skeleton-text-lg" style="width: 60%; margin-bottom: 0.5rem;"></div>
        <div class="skeleton skeleton-text" style="width: 90%;"></div>
        <div class="skeleton skeleton-text" style="width: 70%;"></div>
        <div class="skeleton-action-bar">
          <div class="skeleton skeleton-action-pill"></div>
          <div class="skeleton skeleton-action-pill"></div>
          <div class="skeleton skeleton-action-pill"></div>
          <div class="skeleton skeleton-action-pill" style="width: 80px;"></div>
          <div class="skeleton skeleton-action-pill" style="width: 80px;"></div>
        </div>
      </div>
      <div class="post-skeleton-item">
        <div class="skeleton-meta">
          <div class="skeleton skeleton-round" style="width: 36px; height: 36px;"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton-text-sm" style="width: 30%;"></div>
            <div class="skeleton skeleton-text" style="width: 20%; height: 0.7rem;"></div>
          </div>
        </div>
        <div class="skeleton skeleton-text-lg" style="width: 60%; margin-bottom: 0.5rem;"></div>
        <div class="skeleton skeleton-text" style="width: 90%;"></div>
        <div class="skeleton skeleton-text" style="width: 70%;"></div>
        <div class="skeleton-action-bar">
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
    .profile-skeleton {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .skeleton-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-bottom: 2rem;
      overflow: hidden;
    }
    .skeleton-header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0 2rem;
      margin-top: -70px;
      margin-bottom: 1.5rem;
    }
    .skeleton-info {
      padding: 0 2rem 2rem;
    }
    .skeleton-stats {
      display: flex;
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    .skeleton-tabs {
      display: flex;
      gap: 2rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
    }
    .post-skeleton-item {
      padding: 1.5rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-bottom: 1rem;
      background: var(--bg-elevated);
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
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
      margin-top: 1rem;
    }
    @media (max-width: 767px) {
      .profile-skeleton { padding: 1rem 0.75rem; }
      .skeleton-header-top { flex-direction: column; align-items: center; padding: 0 1rem; margin-top: -50px; }
      .skeleton-info { padding: 0 1rem 1.5rem; }
      .skeleton-stats { justify-content: center; }
      .skeleton-tabs { gap: 1rem; overflow-x: auto; }
    }
  `]
})
export class ProfileSkeletonComponent {}
