import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="post-skeleton-item" *ngFor="let _ of [].constructor(count); let i = index" [style.animation-delay]="(i % 6) * 0.08 + 's'">
      <div class="skeleton-meta">
        <div class="skeleton skeleton-round" style="width: 40px; height: 40px;"></div>
        <div style="flex: 1; min-width: 0;">
          <div class="meta-skeleton-row">
            <div class="skeleton skeleton-text-sm" style="width: 60px; margin-bottom: 0; flex-shrink: 0;"></div>
            <div class="skeleton skeleton-bullet"></div>
            <div class="skeleton skeleton-text-sm" style="width: 48px; margin-bottom: 0; flex-shrink: 0;"></div>
            <div class="skeleton skeleton-bullet"></div>
            <div class="skeleton skeleton-text-sm" style="width: 52px; margin-bottom: 0; flex-shrink: 0;"></div>
            <div class="skeleton skeleton-flair"></div>
          </div>
        </div>
        <div class="skeleton skeleton-action-pill" style="width: 28px; height: 28px; margin-top: 0.25rem;"></div>
      </div>
      <div class="skeleton skeleton-text-lg" style="width: 85%; margin-bottom: 0.75rem;"></div>
      <div class="skeleton skeleton-media" *ngIf="showMedia" style="display: block;"></div>
      <div class="skeleton skeleton-text" style="width: 100%;"></div>
      <div class="skeleton skeleton-text" style="width: 92%;"></div>
      <div class="skeleton skeleton-text" style="width: 55%;"></div>
      <div class="skeleton-action-bar">
        <div class="skeleton skeleton-action-pill"></div>
        <div class="skeleton skeleton-action-pill"></div>
        <div class="skeleton skeleton-action-pill"></div>
        <div class="skeleton skeleton-action-pill" style="width: 80px;"></div>
        <div class="skeleton skeleton-action-pill" style="width: 80px;"></div>
      </div>
    </div>
  `,
  styles: [`
    .post-skeleton-item {
      padding: 2rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .post-skeleton-item:first-child { padding-top: 0; }
    .skeleton-meta {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .meta-skeleton-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    @media (max-width: 767px) {
      .post-skeleton-item { padding: 1.25rem 0; }
    }
  `]
})
export class PostSkeletonComponent {
  @Input() count = 6;
  @Input() showMedia = false;
}
