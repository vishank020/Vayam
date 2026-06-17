import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostService, FeedPostResponse } from '../../../../core/post.service';
import { QnaService, AnswerResponse } from '../../../../core/qna.service';
import { PostSkeletonComponent } from '../../../../shared/components/post-skeleton.component';

@Component({
  selector: 'app-drafts-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PostSkeletonComponent],
  template: `
    <div class="drafts-page">
      <h1>Drafts</h1>

      <app-post-skeleton *ngIf="loading" [count]="4"></app-post-skeleton>

      <ng-container *ngIf="!loading">
        <section class="draft-section" *ngIf="postDrafts.length > 0">
          <h2>Post Drafts</h2>
          <div class="draft-item" *ngFor="let d of postDrafts">
            <div class="draft-info">
              <a [routerLink]="['/posts', d.id, 'edit']" class="draft-title">{{ d.title || 'Untitled' }}</a>
              <span class="draft-meta">{{ d.updatedAt | date:'short' }}</span>
            </div>
          </div>
        </section>

        <section class="draft-section" *ngIf="answerDrafts.length > 0">
          <h2>Answer Drafts</h2>
          <div class="draft-item" *ngFor="let d of answerDrafts">
            <div class="draft-info">
              <a [routerLink]="['/questions', d.questionId]" class="draft-title">{{ d.body | slice:0:80 }}{{ d.body.length > 80 ? '...' : '' }}</a>
              <span class="draft-meta">{{ d.updatedAt | date:'short' }}</span>
            </div>
          </div>
        </section>

        <div *ngIf="postDrafts.length === 0 && answerDrafts.length === 0" class="empty">
          No drafts yet.
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .drafts-page { max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
    h1 { margin-bottom: 1.5rem; font-size: 1.5rem; }
    .loading { text-align: center; color: var(--text-muted); padding: 2rem; }
    .draft-section { margin-bottom: 2rem; }
    .draft-section h2 { font-size: 1.1rem; margin-bottom: 0.75rem; color: var(--text-main); }
    .draft-item { display: flex; align-items: center; padding: 0.75rem; border-radius: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); margin-bottom: 0.5rem; }
    .draft-item:hover { border-color: var(--accent-color); }
    .draft-info { flex: 1; min-width: 0; }
    .draft-title { font-weight: 500; color: var(--text-main); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .draft-title:hover { color: var(--accent-color); }
    .draft-meta { font-size: 0.8rem; color: var(--text-muted); }
    .empty { text-align: center; color: var(--text-muted); padding: 3rem 1rem; }
    @media (max-width: 767px) { .drafts-page { margin: 1rem auto; } }
  `]
})
export class DraftsPageComponent implements OnInit {
  postDrafts: FeedPostResponse[] = [];
  answerDrafts: AnswerResponse[] = [];
  loading = true;

  constructor(
    private postService: PostService,
    private qnaService: QnaService
  ) {}

  ngOnInit(): void {
    this.postService.getDrafts(0, 50).subscribe({
      next: (res) => { this.postDrafts = res.content || []; this.checkLoaded(); },
      error: () => { this.checkLoaded(); }
    });
    this.qnaService.getAnswerDrafts(0, 50).subscribe({
      next: (res) => { this.answerDrafts = res.content || []; this.checkLoaded(); },
      error: () => { this.checkLoaded(); }
    });
  }

  private loaded = 0;
  private checkLoaded(): void {
    this.loaded++;
    if (this.loaded >= 2) this.loading = false;
  }
}
