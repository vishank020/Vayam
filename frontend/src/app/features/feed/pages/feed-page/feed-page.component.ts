import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PostService, FeedPostResponse } from '../../../../core/post.service';
import { AuthService } from '../../../../core/auth.service';
import { ToastService } from '../../../../core/toast.service';
import { timeAgo } from '../../../../core/time-ago';
import { marked } from 'marked';
import { PostActionsMenuComponent } from '../../../post/components/post-actions-menu/post-actions-menu.component';
import { AnonymousBrowsingService } from '../../../../core/anonymous-browsing.service';
import { optimisticToggleVote, optimisticToggleSave } from '../../../../core/post-interaction.util';
import { PostSkeletonComponent } from '../../../../shared/components/post-skeleton.component';
import { ShareDmModalComponent } from '../../../../shared/components/share-dm-modal.component';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PostActionsMenuComponent, PostSkeletonComponent, ShareDmModalComponent],
  template: `
    <div class="feed-page">

      <app-post-skeleton *ngIf="loading" [count]="8"></app-post-skeleton>
      <div *ngIf="!loading && posts.length === 0 && !feedError" class="empty">
        No posts yet. <a routerLink="/posts/new">Create the first post</a>.
      </div>

      <div *ngIf="feedError" class="feed-error">
        <p>Could not load posts.</p>
        <button (click)="loadFeed()">Try again</button>
      </div>

      <div class="post-list" *ngIf="!loading && !feedError">
        <div class="post-item" *ngFor="let post of posts" (click)="openPost($event, post)">
          
          <div class="post-meta">
            <a class="avatar" *ngIf="!post.isAnonymous" [routerLink]="['/u', post.authorUsername]" (click)="stopPropagation($event)" style="position: relative;">
              <div class="skeleton skeleton-overlay" *ngIf="post.authorAvatarUrl && !isImageLoaded(post.authorAvatarUrl)" style="border-radius: 50;"></div>
              <img *ngIf="post.authorAvatarUrl" [src]="post.authorAvatarUrl" (load)="onImageLoaded(post.authorAvatarUrl)" alt="" class="avatar-img">
              <span *ngIf="!post.authorAvatarUrl" class="avatar-initials">{{ (post.authorDisplayName || '?')[0] }}</span>
            </a>
            <span class="avatar" *ngIf="post.isAnonymous">
              <span class="avatar-initials avatar-anon">A</span>
            </span>
            <div class="meta-text">
              <div class="meta-community" *ngIf="post.communityId">
                <a [routerLink]="['/c', post.communitySlug || post.communityId]" class="community-link" (click)="stopPropagation($event)">
                  c/{{ post.communitySlug || post.communityName }}
                </a>
              </div>
              <div class="meta-secondary">
                <a *ngIf="!post.isAnonymous && post.authorUsername"
                   [routerLink]="['/u', post.authorUsername]"
                   class="user-link" (click)="stopPropagation($event)">
                  u/{{ post.authorUsername }}
                </a>
                <span *ngIf="post.isAnonymous" class="user-link">Anonymous</span>
                <span class="meta-separator">&bull;</span>
                <span class="timestamp">{{ postLabel(post) }}</span>
                <span class="flair" [ngClass]="'flair--' + post.postType.toLowerCase()">
                  {{ post.postType }}
                </span>
              </div>
            </div>
            <div style="margin-left: auto;" (click)="stopPropagation($event)">
              <app-post-actions-menu
                [postId]="post.id"
                [authorId]="post.authorId"
                [authorUsername]="post.authorUsername"
                (deleteRequested)="onPostDeleted(post)"
                (hidden)="onPostHidden(post)">
              </app-post-actions-menu>
            </div>
          </div>

          <a [routerLink]="['/posts', post.id]" class="title" (click)="stopPropagation($event)">{{ post.title }}</a>

          <ng-container *ngIf="firstImage(post) as mediaUrl">
             <div class="img-wrapper" style="border-radius: 12px; margin-bottom: 1rem; cursor: pointer;">
              <div class="skeleton skeleton-overlay" *ngIf="!isImageLoaded(mediaUrl)" style="border-radius: 12px;"></div>
              <img [src]="mediaUrl" (load)="onImageLoaded(mediaUrl)" class="feed-media-preview" alt="Post media" style="display: block; width: 100%;" />
            </div>
          </ng-container>

          <div class="body-preview" [innerHTML]="getPreviewHtml(post.content)"></div>

          <div class="action-bar">
            <!-- Primary Action: Like -->
            <button class="action-pill" [class.active-like]="post.userVote === 1" (click)="toggleVote($event, post, 1)" title="Like">
              <svg *ngIf="post.userVote !== 1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
              <svg *ngIf="post.userVote === 1" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
              <span>{{ post.upvoteCount || 0 }}</span>
            </button>

            <!-- Primary Action: Dislike -->
            <button class="action-pill" [class.active-dislike]="post.userVote === -1" (click)="toggleVote($event, post, -1)" title="Dislike">
              <svg *ngIf="post.userVote !== -1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
              </svg>
              <svg *ngIf="post.userVote === -1" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
              </svg>
              <span>{{ post.downvoteCount || 0 }}</span>
            </button>

            <!-- Primary Action: Comment -->
            <a [routerLink]="['/posts', post.id]" class="action-pill" title="Comments" (click)="stopPropagation($event)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span>{{ post.commentCount }}</span>
            </a>

            <!-- Primary Action: Save -->
            <button class="action-pill" [class.active-save]="post.isSaved" (click)="toggleSave($event, post)" [title]="post.isSaved ? 'Saved' : 'Save'">
              <svg *ngIf="!post.isSaved" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              <svg *ngIf="post.isSaved" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              <span class="desktop-text">{{ post.isSaved ? 'Saved' : 'Save' }}</span>
            </button>

            <!-- Primary Action: Share -->
            <button class="action-pill" (click)="sharePost($event, post)" title="Share">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              <span class="desktop-text">Share</span>
            </button>
          </div>
        </div>
      </div>

      <div class="pagination" *ngIf="!loading && totalPages > 1">
        <button [disabled]="page === 0" (click)="goToPage(page - 1)">Prev</button>
        <span class="page-info">{{ page + 1 }} / {{ totalPages }}</span>
        <button [disabled]="page >= totalPages - 1" (click)="goToPage(page + 1)">Next</button>
      </div>
      <app-share-dm-modal
        *ngIf="sharingPost"
        [postId]="sharingPost.id"
        [postTitle]="sharingPost.title"
        (close)="sharingPost = null"
      ></app-share-dm-modal>
    </div>
  `,
  styles: [`
    .feed-page { max-width: 850px; margin: 0 auto; padding: 1.5rem 1rem; }
    
    .loading, .empty { color: var(--text-muted); font-size: 1rem; padding: 3rem 0; text-align: center; }
    .empty a { color: var(--text-main); text-decoration: underline; font-weight: 500; }
    .feed-error { text-align: center; padding: 48px 16px; color: var(--text-muted); }
    .feed-error button { margin-top: 12px; padding: 8px 20px; border-radius: 6px; background: var(--accent-color); color: var(--bg-main); border: none; cursor: pointer; font-size: 14px; font-weight: 600; }
    
    .post-list { display: flex; flex-direction: column; }
    
    .post-item { padding: 1.25rem 0; border-bottom: 1px solid var(--border-color); transition: all 0.15s; border-radius: 8px; }
    .post-item:first-child { padding-top: 0; }
    .post-item:hover { background-color: var(--bg-hover); padding-left: 0.75rem; padding-right: 0.75rem; margin-left: -0.75rem; margin-right: -0.75rem; border-color: transparent; border-radius: 8px; }

    .post-meta { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem; }
    
    .avatar { display: inline-flex; flex-shrink: 0; }
    .avatar-img, .avatar-initials { height: 40px; width: 40px; border-radius: 50%; object-fit: cover; }
    .avatar-initials { background: var(--text-main); color: var(--bg-main); display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; }
    .avatar-anon { background: var(--border-color); color: var(--text-muted); }
    
    .meta-text { display: flex; flex-direction: column; gap: 0.1rem; }

    .meta-community { line-height: 1.3; }

    .community-link { color: var(--text-main); font-weight: 700; font-size: 1rem; text-decoration: none; letter-spacing: -0.01em; }
    .community-link:hover { text-decoration: underline; }
    
    .meta-secondary { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; font-size: 0.82rem; color: var(--text-muted); }
    .meta-secondary .user-link { color: var(--text-muted); font-weight: 500; text-decoration: none; }
    .meta-secondary .user-link:hover { text-decoration: underline; }
    
    .meta-separator { color: var(--text-muted); opacity: 0.4; }

    .timestamp { color: var(--text-muted); }

    .flair { display: inline-flex; align-items: center; gap: 4px; border: none; font-size: 0.68rem; font-weight: 600; padding: 0.1rem 0.45rem; border-radius: 9999px; text-transform: capitalize; letter-spacing: 0; background-color: var(--bg-elevated); color: var(--text-main); }
    .flair-icon { font-size: 0.8rem; line-height: 1; }
    .flair--job { background-color: #dcfce7; color: #166534; }
    .flair--achievement { background-color: #fef08a; color: #854d0e; }
    .flair--project { background-color: #e0e7ff; color: #3730a3; }
    .flair--general { background-color: #e2e8f0; color: #475569; }

    .title { color: var(--text-main); display: block; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.5rem; text-decoration: none; line-height: 1.2; }
    .title:hover { color: var(--accent-color); }

    .body-preview {
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0 0 0.75rem;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      -webkit-mask-image: linear-gradient(to bottom, black 75%, transparent 100%);
      mask-image: linear-gradient(to bottom, black 75%, transparent 100%);
    }
    .body-preview img { display: none; }
    .body-preview pre,
    .body-preview code {
      font-size: 0.85em;
      max-height: 2.4em;
      overflow: hidden;
      white-space: pre-wrap;
      word-break: break-all;
      display: block;
    }
    .body-preview h1,
    .body-preview h2,
    .body-preview h3,
    .body-preview h4 {
      font-size: 1em;
      font-weight: 600;
      margin: 0.2em 0;
    }
    .body-preview blockquote {
      margin: 0.2em 0;
      padding: 0 0.4em;
    }
    .body-preview ul,
    .body-preview ol {
      margin: 0.2em 0;
      padding-left: 1.2em;
    }
    .body-preview p {
      margin: 0 0 0.15em;
    }

    .feed-media-preview { width: 100%; max-height: 500px; object-fit: contain; border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer; background: var(--bg-hover); }

    .action-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
      flex-wrap: wrap;
    }

    .action-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.45rem 0.8rem;
      border-radius: 9999px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.15s, color 0.15s, border-color 0.15s;
      min-width: 44px;
      min-height: 44px;
      user-select: none;
    }

    .action-pill:hover {
      background-color: var(--bg-hover);
      color: var(--text-main);
    }

    .action-pill.active-like {
      color: var(--primary);
      background-color: rgba(var(--primary-rgb), 0.1);
      box-shadow: 0 0 8px rgba(var(--primary-rgb), 0.4);
    }
    .action-pill.active-like:hover {
      background-color: rgba(var(--primary-rgb), 0.2);
    }

    .action-pill.active-dislike {
      color: #e74c3c;
      background-color: rgba(231, 76, 60, 0.1);
      box-shadow: 0 0 8px rgba(231, 76, 60, 0.4);
    }
    .action-pill.active-dislike:hover {
      background-color: rgba(231, 76, 60, 0.2);
    }

    .action-pill.active-save {
      color: var(--accent-color);
      background-color: rgba(var(--primary-rgb), 0.1);
    }
    .action-pill.active-save:hover {
      background-color: rgba(var(--primary-rgb), 0.2);
    }

    @media (min-width: 768px) and (max-width: 1023px) {
      .feed-page { max-width: 100%; padding: 1rem 1.25rem; }
    }
    @media (max-width: 768px) {
      .desktop-text { display: none; }
      .feed-page { padding: 0.75rem; }
      .post-item {
        padding: 0.75rem 0.5rem;
        margin-left: 0;
        margin-right: 0;
        border-radius: 0;
      }
      .post-item:hover {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        margin-left: 0;
        margin-right: 0;
      }
      .title {
        font-size: 1rem;
        line-height: 1.4;
        margin-bottom: 0.35rem;
      }
      .avatar-img, .avatar-initials {
        height: 32px;
        width: 32px;
        font-size: 0.85rem;
      }
      .post-meta {
        gap: 0.35rem;
        margin-bottom: 0.4rem;
      }
      .body-preview {
        margin: 0 0 0.5rem;
        font-size: 0.85rem;
        -webkit-line-clamp: 2;
      }
      .flair {
        font-size: 0.7rem;
        padding: 0.05rem 0.3rem;
      }
      .feed-media-preview {
        max-height: 240px;
        object-fit: cover;
      }
      .action-bar {
        gap: 0.25rem;
        padding-top: 0.5rem;
      }
      .action-pill {
        padding: 0.4rem 0.6rem;
        min-width: 44px;
        min-height: 44px;
        font-size: 0.8rem;
        gap: 0.3rem;
      }
      .action-pill:nth-child(3) {
        margin-left: auto;
      }
      .action-pill:nth-child(4),
      .action-pill:nth-child(5) {
        flex: 1;
        justify-content: center;
      }
    }
    .pagination { display: flex; align-items: center; gap: 1rem; justify-content: center; margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.25rem; }
    .pagination button { background: transparent; border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.85rem; font-weight: 600; padding: 0.5rem 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .pagination button:disabled { opacity: 0.3; border-color: transparent; }
    .pagination button:hover:not(:disabled) { border-color: var(--text-main); }
    .page-info { color: var(--text-muted); font-size: 0.85rem; font-weight: 500; }
  `]
})
export class FeedPageComponent implements OnInit {
  posts: FeedPostResponse[] = [];
  loading = false;
  feedError = false;
  loadedImages = new Set<string>();
  sharingPost: FeedPostResponse | null = null;

  onImageLoaded(url: string): void {
    this.loadedImages.add(url);
  }

  isImageLoaded(url: string): boolean {
    return this.loadedImages.has(url);
  }
  isLoggedIn = false;
  page = 0;
  totalPages = 0;

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private toastService: ToastService,
    private anonymousBrowsingService: AnonymousBrowsingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.checkAuth().subscribe(u => {
      this.isLoggedIn = u !== null;
    });
    this.loadFeed();
  }

  isEdited(post: FeedPostResponse): boolean {
    return new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000;
  }

  postLabel(post: FeedPostResponse): string {
    const ts = this.isEdited(post) ? post.updatedAt : post.createdAt;
    const prefix = this.isEdited(post) ? 'Edited ' : '';
    return prefix + timeAgo(ts);
  }

  isImage(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
  }

  firstImage(post: FeedPostResponse): string | null {
    return post.mediaUrls?.find(url => this.isImage(url)) ?? null;
  }

  getPreviewHtml(content: string): string {
    if (!content) return '';
    const truncated = content.length > 500 ? content.slice(0, 500) + '…' : content;
    return marked.parse(truncated, { breaks: true }) as string;
  }

  onPostDeleted(post: FeedPostResponse): void {
    const idx = this.posts.indexOf(post);
    if (idx === -1) return;
    this.posts.splice(idx, 1);

    this.toastService.showUndo('Post deleted', () => {
      this.posts.splice(idx, 0, post);
    }, () => {
      this.postService.deletePost(post.id).subscribe({
        error: () => {
          this.posts.splice(idx, 0, post);
          this.toastService.showError('Could not delete post.');
        }
      });
    });
  }

  onPostHidden(post: FeedPostResponse): void {
    const idx = this.posts.indexOf(post);
    if (idx === -1) return;
    this.posts.splice(idx, 1);

    this.toastService.showUndo('Post hidden from feed', () => {
      this.posts.splice(idx, 0, post);
    });
  }

  loadFeed(): void {
    this.feedError = false;
    this.loading = true;
    this.postService.getFeed(this.page).subscribe({
      next: (res) => {
        this.posts = res.content;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.feedError = true;
      }
    });
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadFeed();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  openPost(event: Event, post: FeedPostResponse): void {
    const target = event.target as HTMLElement;
    if (target.closest('a') || target.closest('button') || target.closest('app-post-actions-menu') || target.closest('.action-pill')) {
      return;
    }
    this.router.navigate(['/posts', post.id]);
  }

  toggleVote(event: Event, post: FeedPostResponse, direction: number): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    optimisticToggleVote(event, post, direction, this.postService);
  }

  toggleSave(event: Event, post: FeedPostResponse): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    optimisticToggleSave(event, post, this.postService);
  }

  sharePost(event: Event, post: FeedPostResponse): void {
    event.stopPropagation();
    event.preventDefault();
    this.sharingPost = post;
  }
}

