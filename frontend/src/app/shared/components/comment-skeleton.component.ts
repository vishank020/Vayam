import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comment-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="comment-skeleton-item" *ngFor="let _ of [].constructor(count); let i = index" [style.animation-delay]="(i % 4) * 0.08 + 's'">
      <div class="skeleton-row" style="display: flex; gap: 0.6rem;">
        <div class="skeleton skeleton-round" style="width: 32px; height: 32px; flex-shrink: 0;"></div>
        <div style="flex: 1; min-width: 0;">
          <div class="skeleton skeleton-text-sm" style="width: 120px; margin-bottom: 0.3rem;"></div>
          <div class="skeleton skeleton-text" style="width: 180px; height: 0.7rem; margin-bottom: 0.6rem;"></div>
          <div class="skeleton skeleton-text" style="width: 95%;"></div>
          <div class="skeleton skeleton-text" style="width: 80%;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 60px; height: 0.7rem; margin-top: 0.4rem;"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .comment-skeleton-item {
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .comment-skeleton-item:last-child {
      border-bottom: none;
    }
  `]
})
export class CommentSkeletonComponent {
  @Input() count = 4;
}
