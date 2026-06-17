import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService, UserResponse } from '../../../core/user.service';
import { PostService, FeedPostResponse } from '../../../core/post.service';
import { CommentService, CommentResponse } from '../../../core/comment.service';
import { AuthService } from '../../../core/auth.service';
import { FollowService, FollowCountResponse } from '../../../core/follow.service';
import { HttpClient } from '@angular/common/http';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/toast.service';
import { timeAgo } from '../../../core/time-ago';
import { PostActionsMenuComponent } from '../../post/components/post-actions-menu/post-actions-menu.component';
import { optimisticToggleVote, optimisticToggleSave } from '../../../core/post-interaction.util';
import { ProjectListComponent } from '../../project/components/project-list/project-list.component';
import { ShareDmModalComponent } from '../../../shared/components/share-dm-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ImageCropperComponent, PostActionsMenuComponent, ProjectListComponent, ShareDmModalComponent],
  template: `
    <div class="profile-container">
      <div class="profile-header-card">
        <div class="cover-container" *ngIf="profile">
          <img *ngIf="profile.coverUrl" [src]="profile.coverUrl" class="cover-image" alt="Cover" />
          <div *ngIf="!profile.coverUrl" class="cover-placeholder"></div>
          <button class="btn-edit-cover" (click)="coverInput.click()" title="Change Cover">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </button>
          <button class="btn-remove-cover" *ngIf="profile.coverUrl" (click)="removeCover()" title="Remove Cover">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
          <input #coverInput type="file" accept="image/jpeg,image/png,image/webp" (change)="onCoverSelect($event)" hidden />
        </div>
        
        <div class="profile-header-top">
          <div class="avatar-container">
            <img *ngIf="profile?.avatarUrl; else avatarPlaceholder"
                 [src]="profile!.avatarUrl" alt="Avatar" class="avatar-image" />
            <ng-template #avatarPlaceholder>
              <div class="avatar-fallback">{{ initials }}</div>
            </ng-template>
            <button class="btn-remove-avatar" *ngIf="profile?.avatarUrl" (click)="removeAvatar()" title="Remove Avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
            </button>
            <button class="btn-edit-avatar" (click)="avatarInput.click()" title="Change Avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <input #avatarInput type="file" accept="image/jpeg,image/png,image/gif,image/webp" (change)="onAvatarSelect($event)" hidden />
          </div>
          
          <div class="profile-actions">
            <button class="btn-secondary" *ngIf="!isEditing" (click)="shareProfile()">Share Profile</button>
            <button class="btn-secondary" *ngIf="!isEditing" (click)="startEditing()">Edit Profile</button>
            <button class="btn-primary" *ngIf="isEditing" (click)="saveProfile()" [disabled]="saving">Save</button>
            <button class="btn-secondary" *ngIf="isEditing" (click)="cancelEditing()">Cancel</button>
            <button class="btn-icon" routerLink="/settings" title="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </div>

        <div class="profile-info" *ngIf="!isEditing">
          <h1 class="display-name">{{ profile?.displayName || profile?.username }}</h1>
          <p class="username">u/{{ profile?.username }}</p>
          <div class="badges">
            <span class="role-badge">{{ profile?.role }}</span>
          </div>
          
          <p class="bio" *ngIf="profile?.bio">{{ profile?.bio }}</p>
          
          <div class="metadata-row">
            <div class="meta-item" *ngIf="profile?.location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>{{ profile?.location }}</span>
            </div>
            <div class="meta-item" *ngIf="profile?.website">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              <a [href]="profile?.website" target="_blank">{{ profile?.website }}</a>
            </div>
            <div class="meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Joined {{ profile?.createdAt | date:'MMMM yyyy' }}</span>
            </div>
          </div>
          
          <div class="follow-stats" *ngIf="profile">
            <div class="stat"><strong>{{ profile.followingCount }}</strong> <span>Following</span></div>
            <div class="stat"><strong>{{ profile.followerCount }}</strong> <span>Followers</span></div>
            <div class="stat"><strong>{{ profile.postCount || 0 }}</strong> <span>Posts</span></div>
            <div class="stat"><strong>{{ profile.commentCount || 0 }}</strong> <span>Comments</span></div>
          </div>
        </div>

        <div class="profile-edit-form" *ngIf="isEditing">
          <div class="form-group">
            <label>Display Name</label>
            <input [(ngModel)]="editData.displayName" placeholder="Your display name" />
          </div>
          <div class="form-group">
            <label>Bio</label>
            <textarea [(ngModel)]="editData.bio" placeholder="Tell us about yourself" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>Location</label>
              <input [(ngModel)]="editData.location" placeholder="City, Country" />
            </div>
            <div class="form-group half">
              <label>Website</label>
              <input [(ngModel)]="editData.website" placeholder="https://..." />
            </div>
          </div>
          <div class="upload-error" *ngIf="uploadError">{{ uploadError }}</div>
        </div>
      </div>

      <div class="activity-section">
        <div class="tabs">
          <button [class.active]="activeTab === 'posts'" (click)="setTab('posts')">Posts</button>
          <button [class.active]="activeTab === 'comments'" (click)="setTab('comments')">Comments</button>
          <button [class.active]="activeTab === 'saved'" (click)="setTab('saved')">Saved</button>
          <button [class.active]="activeTab === 'upvoted'" (click)="setTab('upvoted')">Upvoted</button>
          <button [class.active]="activeTab === 'projects'" (click)="setTab('projects')">Projects</button>
        </div>

        <div class="tab-content" [ngSwitch]="activeTab">
          <div *ngSwitchCase="'projects'">
            <app-project-list *ngIf="profile" [userId]="profile.id" [editable]="true"></app-project-list>
          </div>
          
          <div *ngSwitchDefault>
            <div *ngIf="loadingTab" class="loading">Loading...</div>
          
            <div *ngIf="!loadingTab && activeTab === 'comments' && tabComments.length === 0" class="empty-state">
              <p>No comments found.</p>
            </div>
            
            <div *ngIf="!loadingTab && activeTab !== 'comments' && tabPosts.length === 0" class="empty-state">
              <p>Nothing to see here yet.</p>
            </div>

            <div *ngIf="!loadingTab && activeTab === 'comments'" class="comment-list">
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
            </div>

            <div *ngIf="!loadingTab && activeTab !== 'comments'" class="feed-posts">
              <div class="post-item" *ngFor="let post of tabPosts">
                <div class="post-meta">
                  <a class="avatar" *ngIf="!post.isAnonymous" [routerLink]="['/u', post.authorUsername]">
                    <img *ngIf="post.authorAvatarUrl" [src]="post.authorAvatarUrl" alt="" class="avatar-img">
                    <span *ngIf="!post.authorAvatarUrl" class="avatar-initials">{{ (post.authorDisplayName || '?')[0] }}</span>
                  </a>
                  <span class="avatar" *ngIf="post.isAnonymous">
                    <span class="avatar-initials avatar-anon">A</span>
                  </span>
                  <div class="meta-text">
                    <div class="meta-top">
                      <a *ngIf="!post.isAnonymous && post.authorUsername" [routerLink]="['/u', post.authorUsername]" class="user-link">u/{{ post.authorUsername }}</a>
                      <span *ngIf="post.isAnonymous" class="user-link">Anonymous</span>
                      <span class="flair" [ngClass]="'flair--' + post.postType.toLowerCase()">{{ post.postType }}</span>
                      <span class="timestamp">{{ postLabel(post) }}</span>
                    </div>
                    <div class="meta-bottom" *ngIf="post.communityId">
                      in <a [routerLink]="['/c', post.communitySlug || post.communityId]" class="community-link">c/{{ post.communitySlug || post.communityName }}</a>
                    </div>
                  </div>
                  
                  <div style="margin-left: auto;">
                    <app-post-actions-menu
                      [postId]="post.id"
                      [authorId]="post.authorId"
                      [authorUsername]="post.authorUsername"
                      (deleteRequested)="onPostDeleted(post)"
                      (hidden)="onPostHidden(post)">
                    </app-post-actions-menu>
                  </div>
                </div>

                <a [routerLink]="['/posts', post.id]" class="title">{{ post.title }}</a>
                <p class="body-preview">{{ post.content }}</p>
                <img *ngIf="firstImage(post)" [src]="firstImage(post)" class="feed-media-preview" alt="post preview">

                <div class="action-bar">
                  <button class="action-pill" [class.active-like]="post.userVote === 1" (click)="toggleVote($event, post, 1)" title="Like">
                    <svg *ngIf="post.userVote !== 1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    <svg *ngIf="post.userVote === 1" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    <span>{{ post.upvoteCount || 0 }}</span>
                  </button>

                  <button class="action-pill" [class.active-dislike]="post.userVote === -1" (click)="toggleVote($event, post, -1)" title="Dislike">
                    <svg *ngIf="post.userVote !== -1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                    </svg>
                    <svg *ngIf="post.userVote === -1" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                    </svg>
                    <span>{{ post.downvoteCount || 0 }}</span>
                  </button>

                  <button class="action-pill" title="Comments" (click)="goToComments($event, post)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    <span *ngIf="post.commentCount && post.commentCount > 0">{{ post.commentCount }}</span>
                  </button>

                  <button class="action-pill" [class.active-save]="post.isSaved" (click)="toggleSave($event, post)" [title]="post.isSaved ? 'Saved' : 'Save'">
                    <svg *ngIf="!post.isSaved" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <svg *ngIf="post.isSaved" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span class="desktop-text">{{ post.isSaved ? 'Saved' : 'Save' }}</span>
                  </button>

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

                  <button class="action-pill" *ngIf="activeTab === 'saved'" (click)="unsavePost(post.id)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    <span class="desktop-text">Unsave</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="pagination" *ngIf="totalPages > 1">
              <button [disabled]="page === 0" (click)="goToPage(page - 1)">Prev</button>
              <span class="page-info">{{ page + 1 }} / {{ totalPages }}</span>
              <button [disabled]="page >= totalPages - 1" (click)="goToPage(page + 1)">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Crop Modal -->
    <div class="modal-overlay" *ngIf="showCropModal">
      <div class="modal-content crop-modal">
        <h3>Adjust Profile Picture</h3>
        <div class="crop-area">
          <image-cropper
            [imageChangedEvent]="imageChangedEvent"
            [maintainAspectRatio]="true"
            [aspectRatio]="1 / 1"
            format="jpeg"
            [transform]="transform"
            (imageCropped)="imageCropped($event)"
            (loadImageFailed)="loadImageFailed()">
          </image-cropper>
        </div>
        <div class="zoom-control">
          <label>Zoom</label>
          <input type="range" min="1" max="3" step="0.1" [(ngModel)]="scale" (ngModelChange)="updateScale()">
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="cancelCrop()">Cancel</button>
          <button class="btn-primary" (click)="saveCrop()">Save Crop</button>
        </div>
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
    .btn-edit-cover { position: absolute; bottom: 12px; right: 12px; width: 36px; height: 36px; border-radius: 50%; background: var(--text-main); color: var(--bg-main); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .btn-edit-cover:hover { transform: scale(1.1); }
    .btn-remove-cover { position: absolute; bottom: 12px; right: 56px; width: 36px; height: 36px; border-radius: 50%; background: var(--danger); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .btn-remove-cover:hover { transform: scale(1.1); }
    
    .profile-header-top { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 2rem; margin-top: -70px; margin-bottom: 1.5rem; }
    
    .avatar-container { position: relative; width: 140px; height: 140px; }
    .avatar-image { width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 4px solid var(--bg-elevated); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .avatar-fallback { width: 140px; height: 140px; border-radius: 50%; background: var(--text-main); color: var(--bg-main); display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; border: 4px solid var(--bg-elevated); }
    .btn-edit-avatar { position: absolute; bottom: 4px; right: 4px; width: 36px; height: 36px; border-radius: 50%; background: var(--text-main); color: var(--bg-main); border: 2px solid var(--bg-elevated); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; z-index: 2; }
    .btn-edit-avatar:hover { transform: scale(1.1); }
    
    .btn-remove-avatar { position: absolute; bottom: 4px; left: 4px; width: 36px; height: 36px; border-radius: 50%; background: var(--danger); color: white; border: 2px solid var(--bg-elevated); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; z-index: 2; }
    .btn-remove-avatar:hover { transform: scale(1.1); }
    
    .profile-actions { display: flex; gap: 0.5rem; align-items: center; }
    .btn-primary { background: var(--text-main); color: var(--bg-main); border: 1px solid var(--text-main); padding: 0.5rem 1rem; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: opacity 0.2s; text-transform: uppercase; letter-spacing: 0.05em; }
    .btn-primary:hover { opacity: 0.8; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-secondary { background: transparent; color: var(--text-main); border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; text-transform: uppercase; letter-spacing: 0.05em; }
    .btn-secondary:hover { background: var(--bg-hover); }
    
    .btn-icon { background: transparent; color: var(--text-muted); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
    .btn-icon:hover { color: var(--text-main); background: var(--bg-hover); }

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

    .profile-edit-form { margin-top: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .form-group.half { flex: 1; margin-bottom: 0; }
    .form-group label { display: block; margin-bottom: 0.4rem; font-weight: 700; color: var(--text-main); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .form-group input, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-main); color: var(--text-main); font-family: inherit; font-size: 0.95rem; box-sizing: border-box; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--text-main); }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .upload-error { color: var(--danger); font-size: 0.85rem; margin-top: 0.5rem; }

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
    .user-link:hover { text-decoration: underline; }
    .community-link { color: var(--text-main); font-weight: 500; text-decoration: underline; }
    .timestamp { color: var(--text-muted); font-size: 0.8rem; }
    .flair { display: inline-flex; align-items: center; border: none; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; background-color: var(--bg-hover); color: var(--text-main); }
    .title { color: var(--text-main); display: block; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 0.5rem; text-decoration: none; line-height: 1.3; }
    .title:hover { text-decoration: underline; }
    .body-preview { color: var(--text-muted); display: -webkit-box; font-size: 0.95rem; -webkit-line-clamp: 3; line-height: 1.5; margin: 0 0 1rem; overflow: hidden; -webkit-box-orient: vertical; }
    .feed-media-preview { width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border-color); }
    .action-bar { display: flex; align-items: center; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem; }

    .action-pill {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.5rem 0.8rem; border-radius: 9999px;
      background: transparent; border: 1px solid transparent; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; cursor: pointer;
      text-decoration: none; transition: background-color 0.15s, color 0.15s, border-color 0.15s; min-width: 44px; min-height: 44px; user-select: none;
    }
    .action-pill:hover { background-color: var(--bg-hover); color: var(--text-main); }
    .action-pill.active-like { color: var(--primary); background-color: rgba(var(--primary-rgb), 0.1); }
    .action-pill.active-dislike { color: #e74c3c; background-color: rgba(231, 76, 60, 0.1); }
    .action-pill.active-save { color: var(--accent-color); background-color: rgba(var(--primary-rgb), 0.1); }

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

      .form-row { flex-direction: column; gap: 0; }

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

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
    .modal-content { background: var(--bg-elevated); border-radius: 16px; padding: 2rem; width: 100%; max-width: 500px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 1.5rem; }
    .crop-modal h3 { margin: 0; color: var(--text-main); font-size: 1.25rem; font-weight: 800; }
    .crop-area { width: 100%; height: 350px; background: #000; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .zoom-control { display: flex; align-items: center; gap: 1rem; }
    .zoom-control label { color: var(--text-main); font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .zoom-control input { flex: 1; accent-color: var(--text-main); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
  `]
})
export class ProfileComponent implements OnInit {
  profile: UserResponse | null = null;
  isEditing = false;
  saving = false;
  
  editData = {
    displayName: '',
    bio: '',
    location: '',
    website: ''
  };

  followCounts: FollowCountResponse | null = null;

  activeTab: 'posts' | 'comments' | 'saved' | 'upvoted' | 'projects' = 'posts';
  sharingPost: FeedPostResponse | null = null;
  timeAgo = timeAgo;
  tabPosts: FeedPostResponse[] = [];
  tabComments: CommentResponse[] = [];
  loadingTab = false;
  page = 0;
  totalPages = 0;

  selectedFile: File | null = null;
  uploadError = '';
  
  showCropModal = false;
  imageChangedEvent: Event | null = null;
  croppedImage: Blob | null | undefined = null;
  scale = 1;
  transform: any = {};

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private postService: PostService,
    private commentService: CommentService,
    private followService: FollowService,
    private router: Router,
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loadFollowCounts(profile.id);
        this.loadTabData();
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  loadFollowCounts(userId: string): void {
    this.followService.getFollowCounts(userId).subscribe({
      next: (counts) => this.followCounts = counts
    });
  }

  setTab(tab: 'posts' | 'comments' | 'saved' | 'upvoted' | 'projects'): void {
    this.activeTab = tab;
    if (tab === 'projects') return;
    
    this.page = 0;
    this.loadTabData();
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
        error: () => {
          this.tabComments = [];
          this.loadingTab = false;
        }
      });
      return;
    }

    let req;
    if (this.activeTab === 'posts') {
      req = this.postService.getUserPosts(this.profile.id, this.page);
    } else if (this.activeTab === 'saved') {
      req = this.postService.getUserSavedPosts(this.profile.id, this.page);
    } else if (this.activeTab === 'upvoted') {
      req = this.postService.getUserUpvotedPosts(this.profile.id, this.page);
    }

    if (req) {
      req.subscribe({
        next: (res) => {
          this.tabPosts = res.content;
          this.totalPages = res.totalPages;
          this.loadingTab = false;
        },
        error: () => {
          this.loadingTab = false;
        }
      });
    }
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadTabData();
  }

  get initials(): string {
    const name = this.profile?.displayName || this.profile?.username || '?';
    return name.charAt(0).toUpperCase();
  }

  startEditing(): void {
    this.isEditing = true;
    this.editData = {
      displayName: this.profile?.displayName || '',
      bio: this.profile?.bio || '',
      location: this.profile?.location || '',
      website: this.profile?.website || ''
    };
  }

  cancelEditing(): void {
    this.isEditing = false;
  }

  onAvatarSelect(event: Event): void {
    this.uploadError = '';
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      this.uploadError = 'Unsupported file type.';
      input.value = '';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'File exceeds the 5MB limit.';
      input.value = '';
      return;
    }

    this.imageChangedEvent = event;
    this.showCropModal = true;
    this.scale = 1;
    this.transform = { scale: 1 };
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
  }

  loadImageFailed() {
    this.uploadError = 'Failed to load image for cropping.';
    this.cancelCrop();
  }

  updateScale() {
    this.transform = { ...this.transform, scale: this.scale };
  }

  cancelCrop() {
    this.showCropModal = false;
    this.imageChangedEvent = null;
    this.croppedImage = null;
  }

  async saveCrop() {
    if (this.croppedImage) {
      this.selectedFile = new File([this.croppedImage], 'avatar.jpg', { type: 'image/jpeg' });
      
      this.saving = true;
      try {
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('prefix', 'avatars');

        const res = await this.http.post<{ url: string }>(
          `${environment.apiUrl}/storage/upload`, formData
        ).toPromise();

        if (res && res.url) {
          await this.userService.updateProfile({ avatarUrl: res.url }).toPromise();
          if (this.profile) this.profile.avatarUrl = res.url;
        }
      } catch (e) {
        this.uploadError = 'Failed to upload avatar.';
      }
      this.saving = false;
    }
    this.showCropModal = false;
    this.imageChangedEvent = null;
  }

  saveProfile(): void {
    this.saving = true;
    this.userService.updateProfile(this.editData).subscribe({
      next: (res) => {
        this.profile = res;
        this.isEditing = false;
        this.saving = false;
        this.toastService.showSuccess('Profile updated successfully');
      },
      error: () => {
        this.saving = false;
        this.toastService.showError('Failed to update profile');
      }
    });
  }

  removeAvatar(): void {
    if (confirm('Are you sure you want to remove your avatar?')) {
      this.userService.deleteAvatar().subscribe({
        next: (res) => {
          this.profile = res;
          this.toastService.showSuccess('Avatar removed');
        },
        error: () => {
          this.toastService.showError('Failed to remove avatar');
        }
      });
    }
  }

  onCoverSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', 'covers');
      
      this.http.post<{objectName: string, url: string}>(`${environment.apiUrl}/storage/upload`, formData).subscribe({
        next: (res) => {
          this.userService.updateProfile({ coverUrl: res.url }).subscribe({
            next: (updatedProfile) => {
              this.profile = updatedProfile;
              this.toastService.showSuccess('Cover photo updated');
            },
            error: () => this.toastService.showError('Failed to save cover photo')
          });
        },
        error: () => this.toastService.showError('Upload failed')
      });
    }
  }

  removeCover(): void {
    if (confirm('Are you sure you want to remove your cover photo?')) {
      this.userService.updateProfile({ coverUrl: '' }).subscribe({
        next: (res) => {
          this.profile = res;
          this.toastService.showSuccess('Cover photo removed');
        },
        error: () => this.toastService.showError('Failed to remove cover photo')
      });
    }
  }

  shareProfile(): void {
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

  unsavePost(postId: string): void {
    this.postService.unsavePost(postId).subscribe(() => {
      this.tabPosts = this.tabPosts.filter(p => p.id !== postId);
    });
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
    optimisticToggleVote(event, post, direction, this.postService);
  }

  toggleSave(event: Event, post: FeedPostResponse): void {
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
