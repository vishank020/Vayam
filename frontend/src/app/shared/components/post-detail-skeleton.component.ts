import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-detail-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="post-detail-skeleton">
      <div class="skeleton skeleton-text-sm" style="width: 120px; margin-bottom: 2rem;"></div>
      <div class="skeleton-meta">
        <div class="skeleton skeleton-round" style="width: 40px; height: 40px;"></div>
        <div class="skeleton skeleton-text" style="width: 200px;"></div>
        <div class="skeleton skeleton-text-sm" style="width: 80px;"></div>
      </div>
      <div class="skeleton skeleton-text-lg" style="width: 90%;"></div>
      <div class="skeleton skeleton-text-lg" style="width: 60%; margin-bottom: 1.5rem;"></div>
      <div class="skeleton skeleton-text" style="width: 50px; margin-bottom: 2rem;"></div>
      <div class="skeleton skeleton-media" style="height: 300px; margin-bottom: 2rem;"></div>
      <div class="skeleton skeleton-text" style="width: 100%;"></div>
      <div class="skeleton skeleton-text" style="width: 100%;"></div>
      <div class="skeleton skeleton-text" style="width: 90%;"></div>
      <div class="skeleton skeleton-text" style="width: 100%;"></div>
      <div class="skeleton skeleton-text" style="width: 65%; margin-bottom: 2rem;"></div>
      <div class="skeleton-action-bar" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
        <div class="skeleton skeleton-action-pill"></div>
        <div class="skeleton skeleton-action-pill"></div>
        <div class="skeleton skeleton-action-pill"></div>
        <div class="skeleton skeleton-action-pill" style="width: 80px;"></div>
        <div class="skeleton skeleton-action-pill" style="width: 80px;"></div>
      </div>
      <div style="margin: 4rem 0 2rem;">
        <div class="skeleton" style="width: 40px; height: 4px; border-radius: 0;"></div>
      </div>
      <div class="comment-skeleton" *ngFor="let _ of [].constructor(3); let i = index" [style.animation-delay]="(i % 3) * 0.1 + 's'">
        <div class="skeleton-meta">
          <div class="skeleton skeleton-round" style="width: 32px; height: 32px;"></div>
          <div>
            <div class="skeleton skeleton-text-sm" style="width: 100px;"></div>
            <div class="skeleton skeleton-text" style="width: 180px; height: 0.7rem;"></div>
          </div>
        </div>
        <div class="skeleton skeleton-text" style="width: 95%;"></div>
        <div class="skeleton skeleton-text" style="width: 70%;"></div>
        <div class="skeleton skeleton-text-sm" style="width: 60px; height: 0.7rem;"></div>
      </div>
    </div>
  `,
  styles: [`
    .post-detail-skeleton {
      max-width: 680px;
      margin: 0 auto;
      padding: 2rem 1rem 4rem;
    }
    .skeleton-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .comment-skeleton {
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .comment-skeleton:last-child { border-bottom: none; }
    @media (max-width: 767px) {
      .post-detail-skeleton { padding: 1.25rem 0.75rem 3rem; }
    }
  `]
})
export class PostDetailSkeletonComponent {}
