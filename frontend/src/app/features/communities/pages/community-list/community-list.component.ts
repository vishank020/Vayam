import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CommunityService, CommunityResponse } from '../../../../core/community.service';
import { PostSkeletonComponent } from '../../../../shared/components/post-skeleton.component';

@Component({
  selector: 'app-community-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PostSkeletonComponent],
  template: `
    <div class="container">
      <div class="header">
        <h1>Communities</h1>
        <button class="btn-primary" routerLink="/communities/new">Create Community</button>
      </div>

      <app-post-skeleton *ngIf="loading" [count]="5"></app-post-skeleton>
      <div *ngIf="error" class="error-message">{{ error }}</div>

      <div *ngIf="!loading && communities.length === 0" class="empty">
        <p>No communities yet. Be the first to create one!</p>
      </div>

      <div class="community-list" *ngIf="!loading">
        <div class="community-card" *ngFor="let c of communities" (click)="viewCommunity(c.slug)">
          <div class="card-avatar-col">
            <div class="card-avatar" *ngIf="c.avatarUrl">
              <img [src]="c.avatarUrl" alt="" class="card-avatar-img">
            </div>
            <div class="card-avatar card-avatar-fallback" *ngIf="!c.avatarUrl">
              {{ c.name.charAt(0).toUpperCase() }}
            </div>
          </div>
          <div class="card-body">
            <div class="card-top">
              <h3>{{ c.name }}</h3>
              <span class="badge" [class.public]="c.visibility === 'PUBLIC'" [class.private]="c.visibility === 'PRIVATE'">
                {{ c.visibility === 'PUBLIC' ? 'Public' : 'Private' }}
              </span>
            </div>
            <p class="description">{{ c.description || 'No description' }}</p>
            <div class="card-meta">
              <span>{{ c.memberCount }} {{ c.memberCount === 1 ? 'member' : 'members' }}</span>
              <span>Created by u/{{ c.ownerUsername }}</span>
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
    .btn-primary {
      padding: 0.6rem 1.25rem; background: var(--primary); color: white; border: none;
      border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer;
      text-decoration: none;
    }
    .btn-primary:hover { background: #3a5ce5; }
    .loading { text-align: center; color: var(--text-muted); padding: 2rem; }
    .error-message {
      background: #fde8e8; color: #c0392b; padding: 0.6rem; border-radius: 8px;
      margin-bottom: 1rem; font-size: 0.9rem;
    }
    .empty { text-align: center; color: var(--text-muted); padding: 3rem; background: var(--bg-main); border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
    .community-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .community-card {
      background: var(--bg-main); border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);
      padding: 1.25rem; cursor: pointer; transition: box-shadow 0.2s;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .community-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .card-avatar-col { flex-shrink: 0; }
    .card-avatar { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; }
    .card-avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .card-avatar-fallback { display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; font-size: 1.25rem; font-weight: 700; }
    .card-body { flex: 1; min-width: 0; }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; flex-wrap: wrap; gap: 0.5rem; }
    .card-top h3 { margin: 0; font-size: 1.15rem; color: var(--text-main); }
    .badge {
      font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 8px; font-weight: 500;
    }
    .badge.public { background: #e8f5e9; color: #2e7d32; }
    .badge.private { background: #fff3e0; color: #e65100; }
    .description { color: var(--text-muted); margin: 0.3rem 0 0.6rem; font-size: 0.9rem; }
    .card-meta { display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap; }
    .pagination {
      display: flex; justify-content: center; align-items: center; gap: 1rem;
      margin-top: 1.5rem;
    }
    .pagination button {
      padding: 0.4rem 1rem; border: 1px solid var(--border-color); background: var(--bg-main); border-radius: 6px;
      cursor: pointer;
    }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pagination span { font-size: 0.9rem; color: var(--text-muted); }
    @media (max-width: 767px) {
      .container { margin: 1rem auto; }
      .header h1 { font-size: 1.35rem; }
      .community-card { padding: 1rem; }
    }
  `]
})
export class CommunityListComponent implements OnInit {
  communities: CommunityResponse[] = [];
  loading = false;
  error = '';
  currentPage = 0;
  totalPages = 0;

  constructor(
    private communityService: CommunityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCommunities();
  }

  loadCommunities(): void {
    this.loading = true;
    this.error = '';
    this.communityService.listPublic(this.currentPage).subscribe({
      next: (page) => {
        this.communities = page.content;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load communities.';
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadCommunities();
  }

  viewCommunity(slug: string): void {
    this.router.navigate(['/c', slug]);
  }
}
