import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { SearchService, SearchResult } from '../../../../core/search.service';
import { PostSkeletonComponent } from '../../../../shared/components/post-skeleton.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PostSkeletonComponent],
  template: `
    <div class="search-page">
      <div class="search-bar">
        <input [(ngModel)]="query" placeholder="Search posts, communities, users..."
               (keyup.enter)="search()" class="search-input" />
        <select [(ngModel)]="type" class="search-type" (change)="search()">
          <option value="all">All</option>
          <option value="posts">Posts</option>
          <option value="communities">Communities</option>
          <option value="users">Users</option>
        </select>
        <button (click)="search()" class="search-btn">Search</button>
      </div>

      <app-post-skeleton *ngIf="loading" [count]="5"></app-post-skeleton>

      <div class="no-results" *ngIf="!loading && searched && results.length === 0">
        No results found for "{{ initialQuery }}"
      </div>

      <div class="results" *ngIf="results.length > 0">
        <div class="result-card" *ngFor="let result of results">
          <div class="result-card-header">
            <span class="result-type" [ngClass]="'type--' + result.type.toLowerCase()">
              {{ result.type }}
            </span>
          </div>
          <div class="result-content-row">
            <div *ngIf="result.type === 'USER'" class="result-avatar">
              <div *ngIf="result.avatarUrl" class="img-wrapper" style="width: 36px; height: 36px; border-radius: 50%;">
                <div class="skeleton skeleton-overlay" *ngIf="!isImageLoaded(result.avatarUrl)" style="border-radius: 50%;"></div>
                <img [src]="result.avatarUrl" (load)="onImageLoaded(result.avatarUrl)" class="search-avatar-img" alt="avatar" />
              </div>
              <div *ngIf="!result.avatarUrl" class="search-avatar-initials">
                {{ (result.title || '?')[0] | uppercase }}
              </div>
            </div>
            <div class="result-text">
              <a [routerLink]="result.url" class="result-title">{{ result.title }}</a>
              <p class="result-desc">{{ result.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button [disabled]="page === 0" (click)="goToPage(page - 1)">Previous</button>
        <span>Page {{ page + 1 }} of {{ totalPages }}</span>
        <button [disabled]="page >= totalPages - 1" (click)="goToPage(page + 1)">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .search-page {
      max-width: 720px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .search-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .search-input {
      flex: 1;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 0.95rem;
      background: var(--bg-main);
      color: var(--text-main);
    }
    .search-input:focus {
      outline: none;
      border-color: var(--text-main);
    }
    .search-type {
      padding: 0.6rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 0.9rem;
      background: var(--bg-main);
      color: var(--text-main);
    }
    .search-btn {
      background: var(--text-main);
      color: var(--bg-main);
      border: 1px solid var(--text-main);
      padding: 0.6rem 1.2rem;
      border-radius: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
    }
    .search-btn:hover { opacity: 0.8; }
    .loading, .no-results {
      text-align: center;
      color: var(--text-muted);
      padding: 3rem 0;
    }
    .results { display: flex; flex-direction: column; gap: 0.75rem; }
    .result-card {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem 1.25rem;
    }
    .result-card-header {
      margin-bottom: 0.5rem;
    }
    .result-content-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .result-text {
      flex: 1;
    }
    .result-avatar {
      flex-shrink: 0;
    }
    .search-avatar-img, .search-avatar-initials {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
    .search-avatar-initials {
      background: var(--text-main);
      color: var(--bg-main);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
    }
    .result-type {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    .type--post { background: var(--bg-hover); color: var(--text-main); }
    .type--community { background: var(--bg-hover); color: var(--text-main); }
    .type--user { background: var(--bg-hover); color: var(--text-main); }
    .result-title {
      display: block;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
      text-decoration: none;
      margin-bottom: 0.25rem;
    }
    .result-title:hover { text-decoration: underline; }
    .result-desc {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin: 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
    }
    .pagination button {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-main);
      border-radius: 12px;
      padding: 0.4rem 0.8rem;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination button:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--text-main); }
    .pagination span { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }

    @media (max-width: 767px) {
      .search-page { margin: 1rem auto; }
      .search-bar { flex-wrap: wrap; }
      .search-input { min-width: 100%; }
      .search-type { flex: 1; }
      .search-btn { flex: 1; }
      .result-card { padding: 0.75rem 1rem; }
      .result-title { font-size: 0.95rem; }
      .search-avatar-img, .search-avatar-initials { width: 36px; height: 36px; font-size: 1rem; }
    }
  `]
})
export class SearchPageComponent implements OnInit {
  query = '';
  initialQuery = '';
  type = 'all';
  results: SearchResult[] = [];
  loading = false;
  searched = false;
  page = 0;
  totalPages = 0;
  loadedImages = new Set<string>();

  onImageLoaded(url: string): void {
    this.loadedImages.add(url);
  }

  isImageLoaded(url: string): boolean {
    return this.loadedImages.has(url);
  }

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.query = params['q'];
        this.initialQuery = params['q'];
        this.type = params['type'] || 'all';
        this.doSearch();
      }
    });
  }

  search(): void {
    if (!this.query.trim()) return;
    this.router.navigate([], { queryParams: { q: this.query, type: this.type }, replaceUrl: true });
  }

  doSearch(): void {
    this.loading = true;
    this.searched = true;
    this.searchService.search(this.query, this.type, this.page).subscribe({
      next: (res) => {
        this.results = res.results;
        this.totalPages = Math.ceil(res.total / res.size) || 1;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  goToPage(p: number): void {
    this.page = p;
    this.doSearch();
  }
}
