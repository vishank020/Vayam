import { Component, OnInit, ViewChild, ElementRef, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostService, PostResponse } from '../../../../core/post.service';
import { AuthService } from '../../../../core/auth.service';
import { timeAgo } from '../../../../core/time-ago';
import { SafePipe } from '../../../../core/safe.pipe';
import { CommentListComponent } from '../../../comment/comment-list/comment-list.component';
import { ToastService } from '../../../../core/toast.service';
import { marked } from 'marked';
import { PostActionsMenuComponent } from '../../components/post-actions-menu/post-actions-menu.component';
import { AnonymousBrowsingService } from '../../../../core/anonymous-browsing.service';
import { PostDetailSkeletonComponent } from '../../../../shared/components/post-detail-skeleton.component';
import { optimisticToggleVote, optimisticToggleSave } from '../../../../core/post-interaction.util';
import { ShareDmModalComponent } from '../../../../shared/components/share-dm-modal.component';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CommentListComponent, SafePipe, PostActionsMenuComponent, PostDetailSkeletonComponent, ShareDmModalComponent],
  template: `
    <div class="post-detail-page">
      <app-post-detail-skeleton *ngIf="loading"></app-post-detail-skeleton>
      <div *ngIf="error" class="error">{{ error }}</div>

      <div class="post-article" *ngIf="!loading && post">
        <div class="post-meta">
          <a class="avatar" *ngIf="!post.isAnonymous" [routerLink]="['/u', post.authorUsername]" style="position: relative;">
            <div class="skeleton skeleton-overlay" *ngIf="post.authorAvatarUrl && !isImageLoaded(post.authorAvatarUrl)" style="border-radius: 50;"></div>
            <img *ngIf="post.authorAvatarUrl" [src]="post.authorAvatarUrl" (load)="onImageLoaded(post.authorAvatarUrl)" alt="" class="avatar-img">
            <span *ngIf="!post.authorAvatarUrl" class="avatar-initials">{{ (post.authorDisplayName || '?')[0] | uppercase }}</span>
          </a>
          <span class="avatar" *ngIf="post.isAnonymous">
            <span class="avatar-initials avatar-anon">A</span>
          </span>
          <a *ngIf="!post.isAnonymous && post.authorUsername"
             [routerLink]="['/u', post.authorUsername]"
             class="post-author">u/{{ post.authorUsername }}</a>
          <span *ngIf="post.isAnonymous" class="post-author">Anonymous</span>
          <span class="separator">/</span>
          <a *ngIf="post.communityId"
             [routerLink]="['/c', post.communitySlug || post.communityId]"
             class="post-community">c/{{ post.communitySlug || post.communityName }}</a>
          <span class="separator">/</span>
          <span class="post-time" *ngIf="!post.isEdited">{{ postLabel }}</span>
          <span class="edited-badge" *ngIf="post.isEdited">{{ postLabel }}</span>
          
          <div style="margin-left: auto;">
              <app-post-actions-menu
                [postId]="post.id"
                [authorId]="post.authorId"
                [authorUsername]="post.authorUsername"
                (deleteRequested)="onPostDeleted()">
              </app-post-actions-menu>
          </div>
        </div>
        
        <div class="post-detail-context" *ngIf="post.communityId">
          <a [routerLink]="['/c', post.communitySlug || post.communityId]" class="context-community">c/{{ post.communitySlug || post.communityName }}</a>
          <span class="context-separator" *ngIf="post.tagName"> &bull; </span>
          <span class="context-tag" *ngIf="post.tagName" 
                [style.color]="post.tagColor || 'var(--text-muted)'"
                [style.border-color]="post.tagColor || 'var(--border-color)'">
            {{ post.tagName }}
          </span>
        </div>

        <h1 class="post-title">{{ post.title }}</h1>
        <div class="flair" [ngClass]="'flair--' + post.postType.toLowerCase()">
          {{ post.postType }}
        </div>
        
        <div class="post-content" [innerHTML]="renderedContent"></div>

        <div class="post-media" *ngIf="post.mediaUrls?.length">
          <ng-container *ngFor="let url of post.mediaUrls">
            <div *ngIf="isImage(url)" class="img-wrapper" style="border-radius: 8px; display: inline-block;">
              <div class="skeleton skeleton-overlay" *ngIf="!isImageLoaded(url)" style="border-radius: 8px;"></div>
              <img [src]="url" (load)="onImageLoaded(url)" class="post-media-image" alt="post image" style="display: block;" />
            </div>
            <video *ngIf="isVideo(url)" [src]="url" controls class="post-media-video"></video>
            <ng-container *ngIf="getYouTubeEmbedUrl(url) as embedUrl">
              <iframe [src]="embedUrl | safe" class="post-media-iframe" frameborder="0" allowfullscreen></iframe>
            </ng-container>
            <a *ngIf="!isImage(url) && !isVideo(url) && !isYouTube(url)" [href]="url" target="_blank" rel="noopener" class="post-media-link">{{ url }}</a>
          </ng-container>
        </div>
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
          <button class="action-pill" title="Comments" (click)="goToComments($event)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span>{{ commentCount }}</span>
          </button>

          <!-- Primary Action: Save -->
          <button class="action-pill" [class.active-save]="post.isSaved" (click)="toggleSave($event)" [title]="post.isSaved ? 'Saved' : 'Save'">
            <svg *ngIf="!post.isSaved" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <svg *ngIf="post.isSaved" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="desktop-text">{{ post.isSaved ? 'Saved' : 'Save' }}</span>
          </button>

          <!-- Primary Action: Share -->
          <button class="action-pill" (click)="sharePost($event)" title="Share">
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

      <div class="comments-divider" *ngIf="!loading && post"></div>

      <div #commentsSection class="comments-section" *ngIf="postId && post">
        <app-comment-list [postId]="postId" [postAuthorId]="post.authorId" (totalCount)="commentCount = $event"></app-comment-list>
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
    .post-detail-page { max-width: 680px; margin: 0 auto; padding: 2rem 1rem 4rem; }
    
    .back-link { color: var(--text-main); text-decoration: none; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 2rem; border-bottom: 1px solid var(--text-main); padding-bottom: 2px; }
    .back-link:hover { opacity: 0.7; }
    
    .loading, .error { text-align: center; padding: 3rem 0; font-size: 1rem; color: var(--text-muted); }
    .error { color: var(--danger); }
    
    .post-article { padding: 0; }
    
    .post-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; }
    
    .avatar { display: inline-flex; flex-shrink: 0; }
    .avatar-img, .avatar-initials { height: 40px; width: 40px; border-radius: 50%; object-fit: cover; }
    .avatar-initials { background: var(--text-main); color: var(--bg-main); display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; }
    .avatar-anon { background: var(--border-color); color: var(--text-muted); }
    
    .post-author { font-weight: 700; color: var(--text-main); text-decoration: none; }
    .post-author:hover { opacity: 0.8; }
    .post-community { color: var(--text-main); font-weight: 700; text-decoration: none; }
    .post-community:hover { text-decoration: underline; }
    .separator { opacity: 0.3; }
    
    .post-detail-context { display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem; }
    .context-community { color: var(--accent-color); text-decoration: none; }
    .context-community:hover { text-decoration: underline; }
    .context-separator { color: var(--text-muted); opacity: 0.5; }
    .context-tag { font-size: 0.8rem; padding: 0.1rem 0.5rem; border: 1px solid; border-radius: 4px; font-weight: 700; text-transform: uppercase; }

    .post-title {
      margin: 0 0 1rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.1;
      letter-spacing: -0.03em;
      font-size: 2.2rem;

      @media (max-width: 768px) {
        font-size: 1.75rem;
      }

      @media (max-width: 480px) {
        font-size: 1.4rem;
      }
    }
    
    .edited-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      background-color: rgba(234, 179, 8, 0.15);
      color: #b45309;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .flair { display: inline-flex; align-items: center; gap: 4px; border: none; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 9999px; text-transform: capitalize; letter-spacing: 0; background-color: var(--bg-elevated); color: var(--text-main); margin-bottom: 2rem; }
    .flair-icon { font-size: 0.8rem; line-height: 1; }
    .flair--job { background-color: #dcfce7; color: #166534; }
    .flair--achievement { background-color: #fef08a; color: #854d0e; }
    .flair--project { background-color: #e0e7ff; color: #3730a3; }
    .flair--general { background-color: #e2e8f0; color: #475569; }
    
    .post-content { color: var(--text-main); font-size: 1.15rem; line-height: 1.7; font-weight: 400; margin-bottom: 3rem; }
    .post-content p { margin: 0 0 1.2rem; }
    .post-content h1, .post-content h2, .post-content h3 { margin: 2rem 0 1rem; font-weight: 800; letter-spacing: -0.02em; }
    .post-content h1 { font-size: 2rem; }
    .post-content h2 { font-size: 1.5rem; }
    .post-content ul, .post-content ol { margin: 0 0 1.2rem; padding-left: 1.5rem; }
    .post-content code { background: var(--bg-hover); padding: 0.2rem 0.4rem; border-radius: 12px; font-size: 0.9em; font-family: monospace; border: 1px solid var(--border-color); }
    .post-content pre { background: var(--bg-hover); padding: 1rem; border-radius: 12px; overflow-x: auto; margin: 0 0 1.2rem; border: 1px solid var(--border-color); }
    .post-content pre code { border: none; background: transparent; padding: 0; }
    .post-content blockquote { border-left: 4px solid var(--text-main); margin: 0 0 1.2rem; padding: 0.5rem 1rem; color: var(--text-muted); font-style: italic; }
    .post-content a { color: var(--accent-color); text-decoration: underline; font-weight: 500; }
    .post-content img { max-width: 100%; height: auto; border: 1px solid var(--border-color); margin: 1rem 0; display: block; }
    .post-content hr { border: none; border-top: 1px solid var(--border-color); margin: 2rem 0; }

    .post-media { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 3rem; }
    .post-media img,
    .post-media video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .post-media-iframe { width: 100%; height: 400px; border: 1px solid var(--border-color); }
    .post-media-link { color: var(--accent-color); font-size: 0.9rem; word-break: break-all; text-decoration: underline; font-weight: 500; }

    .comments-divider { height: 4px; background-color: var(--text-main); margin: 4rem 0 2rem; width: 40px; }

    .action-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
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

    @media (max-width: 768px) {
      .post-detail-page { padding: 1.25rem 0.75rem calc(3rem + 56px); }
      .post-content { font-size: 1rem; }
      .post-content h1 { font-size: 1.5rem; }
      .post-content h2 { font-size: 1.3rem; }
      .post-content pre { font-size: 0.85rem; }
      .post-media-iframe { aspect-ratio: 16/9; height: auto; }
      .desktop-text { display: none; }

      .avatar-img, .avatar-initials { height: 28px; width: 28px; font-size: 0.75rem; }
      .post-meta { font-size: 0.75rem; gap: 0.3rem; }

      .post-media {
        flex-direction: row;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        gap: 0.5rem;
        margin: 0 -0.75rem;
        padding: 0 0.75rem;
      }
      .post-media > .img-wrapper,
      .post-media > img,
      .post-media > video,
      .post-media > iframe,
      .post-media > a {
        width: 85vw;
        scroll-snap-align: start;
        flex-shrink: 0;
      }

      .action-bar {
        position: sticky;
        bottom: 56px;
        z-index: 100;
        background: var(--bg-main);
        border-top: 1px solid var(--border-color);
        padding: 0.6rem 0.75rem;
        margin: 1.5rem -0.75rem 0;
      }
      .action-pill {
        flex: 1;
        justify-content: center;
        padding: 0.35rem 0.4rem;
        min-width: 44px;
        min-height: 44px;
        font-size: 0.8rem;
      }
    }
  `]
})
export class PostDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  post: PostResponse | null = null;
  postId: string | null = null;
  loading = false;
  sharingPost: PostResponse | null = null;
  error = '';
  loadedImages = new Set<string>();

  onImageLoaded(url: string): void {
    this.loadedImages.add(url);
  }

  isImageLoaded(url: string): boolean {
    return this.loadedImages.has(url);
  }
  isLoggedIn = false;
  commentCount = 0;
  isEdited = false;
  postLabel = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
    private authService: AuthService,
    private toastService: ToastService,
    private anonymousBrowsingService: AnonymousBrowsingService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.isLoggedIn = user !== null;
      });

    this.authService.checkAuth()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.loadPost(id);
        }
      });
  }

  loadPost(id: string): void {
    this.postId = id;
    this.post = null;
    this.error = '';
    this.loading = true;
    this.postService.getPost(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post) => {
          this.post = post;
          this.loading = false;
          this.isEdited = new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000;
          const ts = this.isEdited ? post.updatedAt : post.createdAt;
          const prefix = this.isEdited ? 'Edited ' : '';
          this.postLabel = prefix + timeAgo(ts);
          
          this.post.upvoteCount = this.post.upvoteCount || 0;
          this.post.downvoteCount = this.post.downvoteCount || 0;
          this.post.userVote = this.post.userVote || 0;
        },
        error: (err) => {
          this.loading = false;
          this.error = err.status === 404 ? 'Post not found.' : 'Failed to load post.';
        }
      });
  }



  toggleVote(event: Event, post: PostResponse, direction: number): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.anonymousBrowsingService.interceptAction()) return;
    optimisticToggleVote(event, post, direction, this.postService);
  }

  toggleSave(event: Event): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.post) return;
    if (!this.anonymousBrowsingService.interceptAction()) return;
    optimisticToggleSave(event, this.post, this.postService);
  }

  sharePost(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.post) return;
    this.sharingPost = this.post;
  }

  @ViewChild('commentsSection') commentsSectionRef!: ElementRef;

  goToComments(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.commentsSectionRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  get renderedContent(): string {
    return marked.parse(this.post?.content || '', { breaks: true }) as string;
  }

  isImage(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
  }

  isVideo(url: string): boolean {
    return /\.(mp4|webm)(\?|$)/i.test(url);
  }

  private extractYouTubeId(url: string): string | null {
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  isYouTube(url: string): boolean {
    return this.extractYouTubeId(url) !== null;
  }

  getYouTubeEmbedUrl(url: string): string | null {
    const id = this.extractYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  onPostDeleted(): void {
    if (this.postId) {
      const idToDelete = this.postId;
      this.router.navigate(['/feed']);
      this.toastService.showUndo('Post removed', () => {}, () => {
        this.postService.deletePost(idToDelete).subscribe();
      });
    }
  }
}

