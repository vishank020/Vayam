import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { QnaService, QuestionResponse } from '../../../../core/qna.service';
import { AnonymousBrowsingService } from '../../../../core/anonymous-browsing.service';
import { PostSkeletonComponent } from '../../../../shared/components/post-skeleton.component';
import { timeAgo } from '../../../../core/time-ago';

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PostSkeletonComponent],
  template: `
    <div class="container">
      <div class="header">
        <h1>Questions</h1>
        <button class="btn-primary" (click)="askQuestion()">Ask Question</button>
      </div>

      <div class="search-bar">
        <input
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange()"
          placeholder="Search questions..."
          class="search-input"
        />
      </div>

      <div class="filter-tabs" [class.filter-disabled]="searchQuery.trim().length > 0">
        <button
          class="filter-tab"
          [class.active]="activeFilter === 'newest'"
          [disabled]="searchQuery.trim().length > 0"
          (click)="setFilter('newest')"
        >Newest</button>
        <button
          class="filter-tab"
          [class.active]="activeFilter === 'unanswered'"
          [disabled]="searchQuery.trim().length > 0"
          (click)="setFilter('unanswered')"
        >Unanswered</button>
      </div>

      <app-post-skeleton *ngIf="loading" [count]="5"></app-post-skeleton>
      <div *ngIf="error" class="error-message">{{ error }}</div>

      <div *ngIf="!loading && questions.length === 0" class="empty">
        <p>{{ searchQuery.trim() ? 'No questions match your search.' : (activeFilter === 'unanswered' ? 'No unanswered questions.' : 'No questions yet. Be the first to ask!') }}</p>
      </div>

      <div class="question-list" *ngIf="!loading">
        <div class="question-card" *ngFor="let q of questions" (click)="viewQuestion(q.id)">
          <div class="stats">
            <div class="stat">
              <span class="stat-num">{{ q.voteCount }}</span>
              <span class="stat-label">votes</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ q.answerCount }}</span>
              <span class="stat-label">{{ q.answerCount === 1 ? 'answer' : 'answers' }}</span>
            </div>
          </div>
          <div class="card-body">
            <h3>{{ q.title }}</h3>
            <p class="body-preview">{{ q.body | slice:0:150 }}{{ q.body.length > 150 ? '...' : '' }}</p>
            <div class="card-meta">
              <span>Asked by &#64;{{ q.authorUsername }}</span>
              <span>{{ timeAgo(q.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">Previous</button>
        <span>Page {{ currentPage + 1 }} of {{ totalPages }}</span>
        <button [disabled]="currentPage >= totalPages - 1" (click)="goToPage(currentPage + 1)">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
    .header h1 { margin: 0; font-size: 1.75rem; color: var(--text-main); }
    .btn-primary { padding: 0.6rem 1.25rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn-primary:hover { background: #3a5ce5; }
    .loading { text-align: center; color: var(--text-muted); padding: 2rem; }
    .error-message { background: #fde8e8; color: #c0392b; padding: 0.6rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
    .empty { text-align: center; color: var(--text-muted); padding: 3rem; background: var(--bg-main); border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
    .search-bar { margin-bottom: 0.75rem; }
    .search-input { width: 100%; padding: 0.65rem 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: var(--bg-main); color: var(--text-main); font-family: inherit; }
    .search-input:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color) 15%, transparent); }
    .filter-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .filter-tab { padding: 0.4rem 0.9rem; border: 1px solid var(--border-color); border-radius: 9999px; background: transparent; color: var(--text-muted); font-size: 0.85rem; cursor: pointer; font-family: inherit; }
    .filter-tab.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }
    .filter-tab:disabled { opacity: 0.4; cursor: not-allowed; }
    .filter-disabled { opacity: 0.6; }
    .question-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .question-card { display: flex; background: var(--bg-main); border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); padding: 1rem; cursor: pointer; transition: box-shadow 0.2s; gap: 1rem; }
    .question-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .stats { min-width: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; }
    .stat { text-align: center; }
    .stat-num { font-size: 1.3rem; font-weight: 700; color: var(--text-main); display: block; }
    .stat-label { font-size: 0.75rem; color: var(--text-muted); }
    .card-body { flex: 1; min-width: 0; }
    .card-body h3 { margin: 0 0 0.3rem; font-size: 1.1rem; color: var(--primary); }
    .body-preview { color: var(--text-muted); margin: 0.3rem 0 0.5rem; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-meta { display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.5rem; }
    .pagination button { padding: 0.4rem 1rem; border: 1px solid var(--border-color); background: var(--bg-main); border-radius: 6px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pagination span { font-size: 0.9rem; color: var(--text-muted); }

    @media (max-width: 767px) {
      .container { margin: 1rem auto; }
      .header h1 { font-size: 1.35rem; }
      .question-card { flex-direction: column; gap: 0.5rem; padding: 0.75rem; }
      .stats { min-width: auto; flex-direction: row; justify-content: flex-end; gap: 0.5rem; }
      .stat { display: flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.5rem; border-radius: 9999px; background: var(--bg-elevated); }
      .stat-num { font-size: 0.75rem; }
      .stat-label { font-size: 0.75rem; }
      .card-body h3 { font-size: 1rem; }
      .card-meta { gap: 0.5rem; font-size: 0.75rem; }
    }
  `]
})
export class QuestionListComponent implements OnInit, OnDestroy {
  questions: QuestionResponse[] = [];
  loading = false;
  error = '';
  currentPage = 0;
  totalPages = 0;
  timeAgo = timeAgo;
  searchQuery = '';
  activeFilter: 'newest' | 'unanswered' = 'newest';
  private searchSubject = new Subject<string>();
  private searchSub: Subscription;

  constructor(
    private qnaService: QnaService,
    private router: Router,
    private anonymousBrowsingService: AnonymousBrowsingService
  ) {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadQuestions();
    });
  }

  ngOnInit(): void {
    this.loadQuestions();
  }

  ngOnDestroy(): void {
    this.searchSub.unsubscribe();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  setFilter(filter: 'newest' | 'unanswered'): void {
    this.activeFilter = filter;
    this.currentPage = 0;
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loading = true;
    this.error = '';
    const q = this.searchQuery.trim() || undefined;
    const filter = q ? undefined : this.activeFilter;
    this.qnaService.listQuestions(this.currentPage, 20, q, filter).subscribe({
      next: (page) => {
        this.questions = page.content;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load questions.';
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadQuestions();
  }

  viewQuestion(id: string): void {
    this.router.navigate(['/questions', id]);
  }

  askQuestion(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    this.router.navigate(['/questions/new']);
  }
}
