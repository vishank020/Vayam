import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { UserService, UserResponse } from '../../../../core/user.service';
import { AuthService } from '../../../../core/auth.service';
import { FollowService } from '../../../../core/follow.service';
import { PostService, FeedPostResponse } from '../../../../core/post.service';
import { CommentService, CommentResponse } from '../../../../core/comment.service';
import { ProjectListComponent } from '../../../project/components/project-list/project-list.component';
import { PostActionsMenuComponent } from '../../../post/components/post-actions-menu/post-actions-menu.component';
import { ToastService } from '../../../../core/toast.service';
import { timeAgo } from '../../../../core/time-ago';
import { AnonymousBrowsingService } from '../../../../core/anonymous-browsing.service';
import { optimisticToggleVote, optimisticToggleSave } from '../../../../core/post-interaction.util';
import { DmService } from '../../../../core/dm.service';
import { ProfileSkeletonComponent } from '../../../../shared/components/profile-skeleton.component';
import { PostSkeletonComponent } from '../../../../shared/components/post-skeleton.component';
import { ShareDmModalComponent } from '../../../../shared/components/share-dm-modal.component';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProjectListComponent, PostActionsMenuComponent, ProfileSkeletonComponent, PostSkeletonComponent, ShareDmModalComponent],
  template: `
    <app-profile-skeleton *ngIf="!profile && !error && !isBlocked"></app-profile-skeleton>
    <div class="profile-container" *ngIf="profile && !isBlocked">
      <div class="profile-header-card">
        <div class="cover-container img-wrapper">
          <ng-container *ngIf="profile.coverUrl; else coverPlaceholder">
            <div class="skeleton skeleton-overlay" *ngIf="!isImageLoaded(profile.coverUrl)"></div>
            <img [src]="profile.coverUrl" (load)="onImageLoaded(profile.coverUrl)" class="cover-image" alt="Cover" />
          </ng-container>
          <ng-template #coverPlaceholder>
            <div class="cover-placeholder"></div>
          </ng-template>
        </div>
        <div class="profile-header-top">
          <div class="avatar-container img-wrapper" style="border-radius: 50%;">
            <div class="skeleton skeleton-overlay" *ngIf="profile.avatarUrl && !isImageLoaded(profile.avatarUrl)" style="border-radius: 50%;"></div>
            <img *ngIf="profile.avatarUrl; else avatarPlaceholder"
                 [src]="profile.avatarUrl" (load)="onImageLoaded(profile.avatarUrl)" alt="Avatar" class="avatar-image" />
            <ng-template #avatarPlaceholder>
              <div class="avatar-fallback">{{ initials }}</div>
            </ng-template>
          </div>
          
          <div class="profile-actions" *ngIf="!isOwnProfile">
            <button class="btn-primary" *ngIf="!profile.isFollowing" (click)="follow()">Follow</button>
            <button class="btn-secondary unfollow" *ngIf="profile.isFollowing" (click)="unfollow()">Unfollow</button>
            <button class="btn-secondary" (click)="message()" [disabled]="messageLoading">Message</button>
            
            <div class="dropdown-wrapper">
              <div class="dropdown" *ngIf="currentUser && currentUser.id !== profile.id" style="position:relative; display:inline-block;" #dropdown>
                <button class="btn-secondary" (click)="toggleDropdown()">&#x22EE;</button>
                <div class="dropdown-menu" *ngIf="showDropdown">
                  <button class="dropdown-item" (click)="copyLink()">Copy Profile Link</button>
                  <button class="dropdown-item" (click)="toggleMute()">{{ profile.isMuted ? 'Unmute User' : 'Mute User' }}</button>
                  <button class="dropdown-item text-danger" (click)="block()">Block User</button>
                  <button class="dropdown-item text-danger" (click)="openReport()">Report User</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-info">
          <h1 class="display-name">{{ profile.displayName || profile.username }}</h1>
          <p class="username">u/{{ profile.username }}</p>
          <div class="badges">
            <span class="role-badge">{{ profile.role }}</span>
          </div>
          
          <p class="bio" *ngIf="profile.bio">{{ profile.bio }}</p>
          
          <div class="metadata-row">
            <div class="meta-item" *ngIf="profile.location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>{{ profile.location }}</span>
            </div>
            <div class="meta-item" *ngIf="profile.website">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              <a [href]="profile.website" target="_blank">{{ profile.website }}</a>
            </div>
            <div class="meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Joined {{ profile.createdAt | date:'MMMM yyyy' }}</span>
            </div>
          </div>
          
          <div class="follow-stats">
            <div class="stat"><strong>{{ profile.followingCount }}</strong> <span>Following</span></div>
            <div class="stat"><strong>{{ profile.followerCount }}</strong> <span>Followers</span></div>
            <div class="stat"><strong>{{ profile.postCount || 0 }}</strong> <span>Posts</span></div>
            <div class="stat"><strong>{{ profile.commentCount || 0 }}</strong> <span>Comments</span></div>
          </div>
        </div>
      </div>

      <div class="report-form" *ngIf="showReport">
        <h3>Report {{ profile.username }}</h3>
        <textarea [(ngModel)]="reportReason" placeholder="Why are you reporting this user?" rows="3"></textarea>
        <div class="report-actions">
          <button class="btn-secondary" (click)="showReport = false; reportReason = ''">Cancel</button>
          <button class="btn-primary danger" (click)="report()" [disabled]="!reportReason.trim()">Submit Report</button>
        </div>
      </div>

      <div class="report-success" *ngIf="reportSuccess">
        <p>Report submitted. Thank you.</p>
      </div>

      <div class="activity-section">
        <div class="tabs">
          <button [class.active]="activeTab === 'posts'" (click)="setTab('posts')">Posts</button>
          <button [class.active]="activeTab === 'comments'" (click)="setTab('comments')">Comments</button>
          <button [class.active]="activeTab === 'projects'" (click)="setTab('projects')">Projects</button>
        </div>

        <div class="tab-content" [ngSwitch]="activeTab">
          <div *ngSwitchCase="'posts'">
            <app-post-skeleton *ngIf="loadingTab" [count]="3"></app-post-skeleton>
            <div *ngIf="!loadingTab && tabPosts.length === 0" class="empty-state">
              <p>No public posts available.</p>
            </div>
            <div class="post-list" *ngIf="!loadingTab && tabPosts.length > 0">
              <div class="post-item" *ngFor="let post of tabPosts">
                <div class="post-meta">
                  <a class="avatar" *ngIf="!post.isAnonymous" [routerLink]="['/u', post.authorUsername]" style="position: relative;">
                    <div class="skeleton skeleton-overlay" *ngIf="post.authorAvatarUrl && !isImageLoaded(post.authorAvatarUrl)" style="border-radius: 50;"></div>
                    <img *ngIf="post.authorAvatarUrl" [src]="post.authorAvatarUrl" (load)="onImageLoaded(post.authorAvatarUrl)" class="avatar-img">
                    <span *ngIf="!post.authorAvatarUrl" class="avatar-initials">{{ (post.authorDisplayName || '?')[0] }}</span>
                  </a>
                  <span class="avatar" *ngIf="post.isAnonymous">
                    <span class="avatar-initials avatar-anon">A</span>
                  </span>
                  <div class="meta-text">
                    <div class="meta-top">
                      <a *ngIf="!post.isAnonymous" [routerLink]="['/u', post.authorUsername]" class="user-link">u/{{ post.authorUsername }}</a>
                      <span class="flair" [ngClass]="'flair--' + post.postType.toLowerCase()">{{ post.postType }}</span>
                      <span class="timestamp">{{ postLabel(post) }}</span>
                    </div>
                    <div class="meta-bottom" *ngIf="post.communityId">
                      in <a [routerLink]="['/c', post.communitySlug || post.communityId]" class="community-link">c/{{ post.communitySlug || post.communityName }}</a>
                    </div>
                  </div>
                    <div style="margin-left: auto;">
                      <app-post-actions-menu [postId]="post.id" [authorId]="post.authorId" [authorUsername]="post.authorUsername" (deleteRequested)="onPostDeleted(post)" (hidden)="onPostHidden(post)"></app-post-actions-menu>
                    </div>
                </div>
                <a [routerLink]="['/posts', post.id]" class="title">{{ post.title }}</a>
                <p class="body-preview">{{ post.content }}</p>
                <img *ngIf="firstImage(post)" [src]="firstImage(post)" class="feed-media-preview">
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
                  <button class="action-pill" title="Comments" (click)="goToComments($event, post)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    <span *ngIf="post.commentCount && post.commentCount > 0">{{ post.commentCount }}</span>
                  </button>

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
              <div class="pagination" *ngIf="totalPages > 1">
                <button [disabled]="page === 0" (click)="goToPage(page - 1)">Prev</button>
                <span class="page-info">{{ page + 1 }} / {{ totalPages }}</span>
                <button [disabled]="page >= totalPages - 1" (click)="goToPage(page + 1)">Next</button>
              </div>
            </div>
          </div>

          <div *ngSwitchCase="'comments'">
            <app-post-skeleton *ngIf="loadingTab" [count]="3"></app-post-skeleton>
            <div *ngIf="!loadingTab && tabComments.length === 0" class="empty-state">
              <p>No comments found.</p>
            </div>
            <div class="comment-list" *ngIf="!loadingTab && tabComments.length > 0">
              <div *ngFor="let comment of tabComments" class="comment-card">
                <div class="comment-header">
                  <a [routerLink]="['/posts', comment.postId]" class="post-link">
                    Commented on post {{ comment.postId.split('-')[0] }}...
                  </a>
                  <span class="comment-date">{{ timeAgo(comment.createdAt) }}</span>
                </div>
                <div class="comment-body">
                  {{ comment.content }}
                </div>
              </div>
              
              <div class="pagination" *ngIf="totalPages > 1">
                <button [disabled]="page === 0" (click)="goToPage(page - 1)">Prev</button>
                <span class="page-info">{{ page + 1 }} / {{ totalPages }}</span>
                <button [disabled]="page >= totalPages - 1" (click)="goToPage(page + 1)">Next</button>
              </div>
            </div>
          </div>

          <div *ngSwitchCase="'projects'">
            <app-project-list [userId]="profile.id" [editable]="false"></app-project-list>
          </div>
        </div>
      </div>
    </div>

    <div class="blocked-overlay" *ngIf="profile && isBlocked">
      <div class="profile-header-card text-center" style="margin-top:2rem;">
        <h3>User Blocked</h3>
        <p>You cannot view this user's profile.</p>
        <button class="btn-primary danger" (click)="unblock()">Unblock User</button>
      </div>
    </div>

    <div class="error-container" *ngIf="error">
      <div class="profile-header-card text-center">
        <h3>{{ error }}</h3>
        <a routerLink="/feed" class="btn-secondary" style="display:inline-block; margin-top:1rem; text-decoration:none;">Back to Feed</a>
      </div>
    </div>
    <app-share-dm-modal
      *ngIf="sharingPost"
      [postId]="sharingPost.id"
      [postTitle]="sharingPost.title"
      (close)="sharingPost = null"
    ></app-share-dm-modal>
  `,
  styles: [`
    .profile-container { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; }
    
    .profile-header-card { background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 2rem; overflow: hidden; }
    
    .cover-container { position: relative; width: 100%; height: 200px; background: var(--bg-hover); }
    .cover-image { width: 100%; height: 100%; object-fit: cover; }
    .cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, var(--border-color) 0%, var(--bg-hover) 100%); }
    
    .profile-header-top { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 2rem; margin-top: -70px; margin-bottom: 1.5rem; }
    
    .avatar-container { position: relative; width: 140px; height: 140px; }
    .avatar-image { width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 4px solid var(--bg-elevated); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .avatar-fallback { width: 140px; height: 140px; border-radius: 50%; background: var(--text-main); color: var(--bg-main); display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; border: 4px solid var(--bg-elevated); }
    
    .profile-actions { display: flex; gap: 0.5rem; align-items: center; }
    button.btn-primary { background: var(--accent-color) !important; color: #ffffff !important; border: 1px solid var(--accent-color) !important; padding: 0.5rem 1rem; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: opacity 0.2s; text-transform: uppercase; letter-spacing: 0.05em; }
    button.btn-primary:hover { opacity: 0.8; }
    button.btn-primary.danger { background: var(--danger) !important; border-color: var(--danger); }
    
    .btn-secondary,
    button.btn-secondary { background: transparent !important; color: var(--text-main) !important; border: 1px solid var(--border-color) !important; padding: 0.5rem 1rem; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; text-transform: uppercase; letter-spacing: 0.05em; }
    .btn-secondary:hover,
    button.btn-secondary:hover { background: var(--bg-hover); }
    .btn-secondary.unfollow,
    button.btn-secondary.unfollow { color: var(--danger); border-color: var(--danger); }
    .btn-secondary.unfollow:hover,
    button.btn-secondary.unfollow:hover { background: var(--danger); color: white; }
    
    .btn-icon { background: transparent; color: var(--text-muted); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
    .btn-icon:hover { color: var(--text-main); background: var(--bg-hover); }

    .dropdown-wrapper { position: relative; }
    .dropdown-menu { position: absolute; right: 0; top: 100%; margin-top: 0.5rem; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 160px; z-index: 100; overflow: hidden; }
    .dropdown-item { width: 100%; text-align: left; background: none; border: none; padding: 0.75rem 1rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .dropdown-item:hover { background: var(--bg-hover); }
    .dropdown-item.text-danger { color: var(--danger); }

    .profile-info { padding: 0 2rem 2rem 2rem; }
    .display-name { font-size: 1.8rem; font-weight: 800; margin: 0; color: var(--text-main); }
    .profile-info .username { margin: 0 0 1rem 0; font-size: 1rem; color: var(--text-muted); }
    
    .badges { margin-bottom: 1rem; }
    .role-badge { display: inline-flex; background: var(--bg-hover); color: var(--text-main); padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid var(--border-color); }
    
    .bio { margin: 0 0 1.5rem 0; font-size: 1rem; line-height: 1.6; color: var(--text-main); white-space: pre-wrap; }
    
    .metadata-row { display: flex; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 1.5rem; }
    .meta-item { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.9rem; }
    .meta-item a { color: var(--text-main); text-decoration: none; font-weight: 500; }
    .meta-item a:hover { text-decoration: underline; }
    
    .follow-stats { display: flex; gap: 1.5rem; }
    .stat { display: flex; align-items: baseline; gap: 0.4rem; font-size: 0.95rem; }
    .stat strong { color: var(--text-main); font-weight: 800; font-size: 1.1rem; }
    .stat span { color: var(--text-muted); }

    .activity-section { margin-top: 2rem; }
    .tabs { display: flex; gap: 2rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem; }
    .tabs button { background: none; border: none; padding: 0 0 1rem 0; color: var(--text-muted); font-weight: 600; font-size: 1rem; cursor: pointer; position: relative; }
    .tabs button:hover { color: var(--text-main); }
    .tabs button.active { color: var(--text-main); }
    .tabs button.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: var(--text-main); }

    .empty-state { text-align: center; padding: 4rem 0; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 12px; }

    .comment-list { display: flex; flex-direction: column; gap: 1rem; }
    .comment-card { background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; }
    .comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .post-link { font-weight: 600; color: var(--accent-color); text-decoration: none; }
    .post-link:hover { text-decoration: underline; }
    .comment-date { font-size: 0.85rem; color: var(--text-muted); }
    .comment-body { color: var(--text-main); font-size: 0.95rem; line-height: 1.5; }

    .post-list { display: flex; flex-direction: column; }
    .post-item { padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 1rem; background: var(--bg-elevated); transition: border-color 0.2s; }
    .post-item:hover { border-color: var(--text-muted); }
    .post-meta { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem; }
    .avatar { display: inline-flex; flex-shrink: 0; }
    .avatar-img, .avatar-initials { height: 36px; width: 36px; border-radius: 50%; object-fit: cover; }
    .avatar-initials { background: var(--text-main); color: var(--bg-main); display: inline-flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; }
    .avatar-anon { background: var(--border-color); color: var(--text-muted); }
    .meta-text { display: flex; flex-direction: column; justify-content: center; line-height: 1.2; }
    .meta-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .meta-bottom { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; }
    .user-link { color: var(--text-main); font-weight: 600; font-size: 0.95rem; text-decoration: none; }
    .community-link { color: var(--text-main); font-weight: 500; text-decoration: underline; }
    .timestamp { color: var(--text-muted); font-size: 0.8rem; }
    .flair { display: inline-flex; align-items: center; border: none; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; background-color: var(--bg-hover); color: var(--text-main); }
    .title { color: var(--text-main); display: block; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 0.5rem; text-decoration: none; line-height: 1.3; }
    .title:hover { text-decoration: underline; }
    .body-preview { color: var(--text-muted); display: -webkit-box; font-size: 0.95rem; -webkit-line-clamp: 3; line-height: 1.5; margin: 0 0 1rem; overflow: hidden; -webkit-box-orient: vertical; }
    .feed-media-preview { width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border-color); }
    .action-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
      margin-top: 1rem;
    }

    .action-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.5rem 0.8rem;
      border-radius: 9999px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      font-size: 0.9rem;
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
      .profile-container { padding: 1rem 0; }
      .cover-container { height: 120px; }
      .profile-header-top {
        flex-direction: column;
        align-items: center;
        padding: 0 1rem;
        margin-top: -36px;
        margin-bottom: 0;
      }
      .avatar-container { width: 72px; height: 72px; }
      .avatar-image { width: 72px; height: 72px; border: 3px solid var(--bg-main); }
      .avatar-fallback { width: 72px; height: 72px; font-size: 1.5rem; border: 3px solid var(--bg-main); }

      .profile-actions { flex-direction: column; width: 100%; margin-top: 0.5rem; align-self: center; gap: 0.4rem; }
      .profile-actions > button { width: 100%; text-align: center; justify-content: center; }

      .profile-info { padding: 0.5rem 1rem 1.5rem; text-align: center; }
      .display-name { font-size: 1.4rem; }
      .metadata-row { justify-content: center; gap: 1rem; }

      .follow-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; justify-items: center; }
      .stat { flex-direction: column; align-items: center; gap: 0.15rem; }
      .stat strong { font-size: 1.125rem; }
      .stat span { font-size: 0.688rem; }

      .tabs { gap: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; }
      .tabs::-webkit-scrollbar { display: none; }
      .tabs button { min-width: 80px; font-size: 0.875rem; white-space: nowrap; padding-bottom: 0.75rem; }

      .post-item { padding: 0.75rem; }
      .post-meta .avatar-img,
      .post-meta .avatar-initials { height: 32px; width: 32px; font-size: 0.8rem; }
      .title { font-size: 1rem; line-height: 1.4; }
      .body-preview { -webkit-line-clamp: 2; font-size: 0.9rem; }
      .feed-media-preview { max-height: 240px; }

      .action-bar { gap: 0.25rem; flex-wrap: wrap; }
      .action-pill { padding: 0.35rem 0.5rem; min-width: 44px; min-height: 44px; font-size: 0.8rem; }
      .action-pill:nth-child(3) { margin-left: auto; }
      .action-pill:nth-child(4),
      .action-pill:nth-child(5) { flex: 1; justify-content: center; }
      .desktop-text { display: none; }
    }
    @media (min-width: 768px) and (max-width: 1023px) {
      .profile-container { padding: 1.5rem 1rem; }
    }

    .pagination { display: flex; align-items: center; gap: 1rem; justify-content: center; margin-top: 2rem; padding-top: 1rem; }
    .pagination button { background: transparent; border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.85rem; font-weight: 700; padding: 0.5rem 1rem; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 12px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
    .pagination button:hover:not(:disabled) { border-color: var(--text-main); }
    .page-info { color: var(--text-muted); font-size: 0.85rem; font-weight: 600; }

    .report-form { background: var(--bg-elevated); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--danger); margin-bottom: 1.5rem; }
    .report-form h3 { margin: 0 0 1rem; font-size: 1.1rem; color: var(--danger); font-weight: 800; }
    .report-form textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 12px; font-size: 0.95rem; box-sizing: border-box; resize: vertical; background: var(--bg-main); color: var(--text-main); font-family: inherit; }
    .report-actions { display: flex; gap: 0.75rem; margin-top: 1rem; justify-content: flex-end; }
    
    .report-success { background: var(--bg-elevated); color: var(--text-main); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1.5rem; font-weight: 700; text-align: center; }
    
    .text-center { text-align: center; }
    .error-container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  `]
})
export class ProfileViewComponent implements OnInit {
  profile: UserResponse | null = null;
  currentUser: UserResponse | null = null;
  isOwnProfile = false;
  loadedImages = new Set<string>();

  onImageLoaded(url: string): void {
    this.loadedImages.add(url);
  }

  isImageLoaded(url: string): boolean {
    return this.loadedImages.has(url);
  }
  isBlocked = false;
  sharingPost: FeedPostResponse | null = null;
  activeTab: 'posts' | 'comments' | 'projects' = 'posts';
  timeAgo = timeAgo;
  showReport = false;
  reportReason = '';
  reportSuccess = false;
  error: string | null = null;
  showDropdown = false;
  messageLoading = false;

  tabPosts: FeedPostResponse[] = [];
  tabComments: CommentResponse[] = [];
  loadingTab = false;
  page = 0;
  totalPages = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private followService: FollowService,
    private postService: PostService,
    private commentService: CommentService,
    private toastService: ToastService,
    private anonymousBrowsingService: AnonymousBrowsingService,
    private dmService: DmService
  ) {}

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) {
      this.error = 'No username specified';
      return;
    }

    this.authService.checkAuth().subscribe(currentUser => {
      this.currentUser = currentUser;

      if (currentUser && currentUser.username === username) {
        this.router.navigate(['/profile']);
        return;
      }

      this.userService.getUserByUsername(username!).subscribe({
        next: (profile) => {
          this.profile = profile;
          this.isOwnProfile = this.currentUser?.id === profile.id;
          this.loadTabData();
        },
        error: () => {
          this.error = 'User not found';
        }
      });
    });
  }

  get initials(): string {
    const name = this.profile?.displayName || this.profile?.username || '?';
    return name.charAt(0).toUpperCase();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  follow(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.currentUser) {
      this.router.navigate(['/login'], { queryParams: { redirectUrl: this.router.url } });
      return;
    }
    if (!this.profile) return;
    this.followService.follow(this.profile.id).subscribe({
      next: () => {
        if (this.profile) {
          this.profile.isFollowing = true;
          this.profile.followerCount++;
        }
      }
    });
  }

  unfollow(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.currentUser) {
      this.router.navigate(['/login'], { queryParams: { redirectUrl: this.router.url } });
      return;
    }
    if (!this.profile) return;
    this.followService.unfollow(this.profile.id).subscribe({
      next: () => {
        if (this.profile) {
          this.profile.isFollowing = false;
          this.profile.followerCount--;
        }
      }
    });
  }

  message(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.currentUser) {
      this.router.navigate(['/login'], { queryParams: { redirectUrl: this.router.url } });
      return;
    }
    if (!this.profile) return;
    this.messageLoading = true;
    this.dmService.createConversation({ participantIds: [this.profile.id] }).subscribe({
      next: (conv) => {
        this.router.navigate(['/dm', conv.id]);
      },
      error: () => {
        this.toastService.showError('Failed to start conversation.');
        this.messageLoading = false;
      }
    });
  }

  block(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.currentUser) {
      this.router.navigate(['/login'], { queryParams: { redirectUrl: this.router.url } });
      return;
    }
    if (!this.profile) return;
    this.showDropdown = false;
    this.userService.blockUser(this.profile.id).subscribe({
      next: () => {
        this.isBlocked = true;
      }
    });
  }

  toggleMute(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.currentUser) {
      this.router.navigate(['/login'], { queryParams: { redirectUrl: this.router.url } });
      return;
    }
    if (!this.profile) return;
    this.showDropdown = false;
    
    if (this.profile.isMuted) {
      this.userService.unmuteUser(this.profile.id).subscribe({
        next: () => {
          if (this.profile) this.profile.isMuted = false;
        }
      });
    } else {
      this.userService.muteUser(this.profile.id).subscribe({
        next: () => {
          if (this.profile) this.profile.isMuted = true;
        }
      });
    }
  }

  unblock(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login'], { queryParams: { redirectUrl: this.router.url } });
      return;
    }
    if (!this.profile) return;
    this.userService.unblockUser(this.profile.id).subscribe({
      next: () => {
        this.isBlocked = false;
      }
    });
  }

  openReport(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.currentUser) {
      this.router.navigate(['/login'], { queryParams: { redirectUrl: this.router.url } });
      return;
    }
    this.showDropdown = false;
    this.showReport = true;
    this.reportSuccess = false;
  }

  copyLink(): void {
    this.showDropdown = false;
    const url = `${window.location.origin}/u/${this.profile?.username}`;
    if (navigator.share) {
      navigator.share({
        title: this.profile?.displayName || this.profile?.username || 'Profile',
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.toastService.showSuccess('Profile link copied');
      });
    }
  }

  report(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login'], { queryParams: { redirectUrl: this.router.url } });
      return;
    }
    if (!this.profile || !this.reportReason.trim()) return;
    this.userService.reportUser(this.profile.id, this.reportReason).subscribe({
      next: () => {
        this.showReport = false;
        this.reportReason = '';
        this.reportSuccess = true;
        setTimeout(() => this.reportSuccess = false, 4000);
      }
    });
  }

  setTab(tab: 'posts' | 'comments' | 'projects'): void {
    this.activeTab = tab;
    if (tab === 'posts' || tab === 'comments') {
      this.page = 0;
      this.loadTabData();
    }
  }

  loadTabData(): void {
    if (!this.profile) return;
    this.loadingTab = true;

    if (this.activeTab === 'comments') {
      this.commentService.getUserComments(this.profile.id, this.page).subscribe({
        next: (res) => {
          this.tabComments = res.content;
          this.totalPages = res.totalPages;
          this.loadingTab = false;
        },
        error: () => this.loadingTab = false
      });
      return;
    }

    if (this.activeTab === 'posts') {
      this.postService.getUserPosts(this.profile.id, this.page).subscribe({
        next: (res) => {
          this.tabPosts = res.content;
          this.totalPages = res.totalPages;
          this.loadingTab = false;
        },
        error: () => this.loadingTab = false
      });
    }
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadTabData();
  }

  onPostDeleted(post: FeedPostResponse): void {
    const idx = this.tabPosts.indexOf(post);
    if (idx === -1) return;
    this.tabPosts.splice(idx, 1);

    this.toastService.showUndo('Post deleted', () => {
      this.tabPosts.splice(idx, 0, post);
    }, () => {
      this.postService.deletePost(post.id).subscribe({
        error: () => {
          this.tabPosts.splice(idx, 0, post);
          this.toastService.showError('Could not delete post.');
        }
      });
    });
  }

  onPostHidden(post: FeedPostResponse): void {
    const idx = this.tabPosts.indexOf(post);
    if (idx === -1) return;
    this.tabPosts.splice(idx, 1);

    this.toastService.showUndo('Post hidden from profile', () => {
      this.tabPosts.splice(idx, 0, post);
    });
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

  toggleVote(event: Event, post: FeedPostResponse, direction: number): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    optimisticToggleVote(event, post, direction, this.postService);
  }

  toggleSave(event: Event, post: FeedPostResponse): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    optimisticToggleSave(event, post, this.postService);
  }

  sharePost(event: Event, post: FeedPostResponse): void {
    event.stopPropagation();
    event.preventDefault();
    this.sharingPost = post;
  }

  goToComments(event: Event, post: FeedPostResponse): void {
    event.stopPropagation();
    event.preventDefault();
    this.router.navigate(['/posts', post.id]);
  }
}
