import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommunityService, CommunityResponse, CommunityMemberResponse, InviteResponse, CommunityRuleResponse, JoinRequestResponse, InviteLinkResponse, BanResponse, ModLogResponse, CommunityAnalyticsResponse, CommunityTagResponse } from '../../../../core/community.service';
import { UserService } from '../../../../core/user.service';
import { AuthService } from '../../../../core/auth.service';
import { PostService, FeedPostResponse } from '../../../../core/post.service';
import { ToastService } from '../../../../core/toast.service';
import { timeAgo } from '../../../../core/time-ago';
import { AnonymousBrowsingService } from '../../../../core/anonymous-browsing.service';
import { PostActionsMenuComponent } from '../../../post/components/post-actions-menu/post-actions-menu.component';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { environment } from '../../../../../environments/environment';
import { optimisticToggleVote, optimisticToggleSave } from '../../../../core/post-interaction.util';
import { CommunitySkeletonComponent } from '../../../../shared/components/community-skeleton.component';
import { PostSkeletonComponent } from '../../../../shared/components/post-skeleton.component';

@Component({
  selector: 'app-community-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PostActionsMenuComponent, ImageCropperComponent, CommunitySkeletonComponent, PostSkeletonComponent],
  template: `
    <div class="container">
      <app-community-skeleton *ngIf="loading && !error"></app-community-skeleton>
      <div *ngIf="error" class="error-message">{{ error }}</div>

      <div *ngIf="community && !loading">
        <div class="banner img-wrapper" [class.banner--empty]="!community.bannerUrl" style="border-radius: 12px;">
          <div class="skeleton skeleton-overlay" *ngIf="community.bannerUrl && !isImageLoaded(community.bannerUrl)" style="border-radius: 12px;"></div>
          <img *ngIf="community.bannerUrl" [src]="community.bannerUrl" (load)="onImageLoaded(community.bannerUrl)" alt="banner" class="banner-img">
          <div *ngIf="!community.bannerUrl" class="banner-fallback"></div>
        </div>

        <div class="header">
          <div class="header-left">
            <div class="avatar img-wrapper" *ngIf="community.avatarUrl" style="border-radius: 50%;">
              <div class="skeleton skeleton-overlay" *ngIf="!isImageLoaded(community.avatarUrl)" style="border-radius: 50%;"></div>
              <img [src]="community.avatarUrl" (load)="onImageLoaded(community.avatarUrl)" alt="avatar" class="avatar-img">
            </div>
            <div class="avatar avatar-fallback" *ngIf="!community.avatarUrl">
              {{ community.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h1>{{ community.name }}</h1>
              <div class="community-slug" style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.1rem; margin-bottom: 0.3rem;">c/{{ community.slug }}</div>
              <div class="header-meta">
                <span class="badge" [ngClass]="{
                  'public': community.visibility === 'PUBLIC',
                  'restricted': community.visibility === 'RESTRICTED',
                  'private': community.visibility === 'PRIVATE'
                }">
                  {{ community.visibility === 'PUBLIC' ? 'Public' : (community.visibility === 'RESTRICTED' ? 'Restricted' : 'Private') }}
                </span>
                <span class="role-badge" *ngIf="community.role !== 'NONE'">{{ community.role }}</span>
                <span class="stat">{{ community.memberCount }} {{ community.memberCount === 1 ? 'member' : 'members' }}</span>
              </div>
            </div>
          </div>
          <div class="actions">
            <button *ngIf="!community.isMember && (community.visibility === 'PUBLIC' || community.visibility === 'RESTRICTED')" class="btn-primary" (click)="joinCommunity()">Join</button>
            <button *ngIf="!community.isMember && community.visibility === 'PRIVATE' && !myJoinRequest" class="btn-primary" (click)="joinCommunity()">Request to Join</button>
            <button *ngIf="!community.isMember && community.visibility === 'PRIVATE' && myJoinRequest?.status === 'PENDING'" class="btn-secondary" disabled>Request Pending</button>
            
            <button *ngIf="canCreatePost()" class="btn-primary" (click)="navigateToCreatePost()">Create Post</button>
            <button *ngIf="canCreatePost()" class="btn-secondary" disabled>Create Poll (Coming Soon)</button>
            
            <button *ngIf="community.isMember && community.role !== 'OWNER'" class="btn-danger-outline" (click)="leaveCommunity()">Leave</button>
          </div>
        </div>

        <p class="description">{{ community.description || 'No description' }}</p>
        <p class="meta-text">Created by u/{{ community.ownerUsername }} &middot; {{ community.createdAt | date:'mediumDate' }}</p>

        <div class="tabs">
          <button [class.active]="activeTab === 'about'" (click)="activeTab = 'about'">About</button>
          <button [class.active]="activeTab === 'posts'" (click)="switchToPosts()">Posts</button>
          <button [class.active]="activeTab === 'members'" (click)="switchToMembers()">Members</button>
          <button *ngIf="canManage()" [class.active]="activeTab === 'settings'" (click)="activeTab = 'settings'">Settings</button>
          <button *ngIf="community.role === 'OWNER' || community.role === 'ADMIN'" [class.active]="activeTab === 'analytics'" (click)="activeTab = 'analytics'">Analytics</button>
        </div>

        <div class="tab-content" *ngIf="activeTab === 'posts'">
          <div class="post-type-filters">
            <button class="filter-pill" [class.active]="selectedPostTypeFilter === ''" (click)="setPostTypeFilter('')">All</button>
            <button class="filter-pill" [class.active]="selectedPostTypeFilter === 'GENERAL'" (click)="setPostTypeFilter('GENERAL')">General</button>
            <button class="filter-pill" [class.active]="selectedPostTypeFilter === 'ACHIEVEMENT'" (click)="setPostTypeFilter('ACHIEVEMENT')">Achievement</button>
            <button class="filter-pill" [class.active]="selectedPostTypeFilter === 'PROJECT'" (click)="setPostTypeFilter('PROJECT')">Project</button>
            <button class="filter-pill" [class.active]="selectedPostTypeFilter === 'JOB'" (click)="setPostTypeFilter('JOB')">Job</button>
          </div>

          <div class="tag-filters" *ngIf="communityTags && communityTags.length > 0" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
            <button class="filter-pill" [class.active]="selectedTagIdFilter === null" (click)="setTagIdFilter(null)">
              All Tags
            </button>
            <button class="filter-pill" *ngFor="let tag of communityTags" 
                    [class.active]="selectedTagIdFilter === tag.id" 
                    (click)="setTagIdFilter(tag.id)"
                    [style.border-color]="tag.color"
                    [style.color]="selectedTagIdFilter === tag.id ? '#fff' : tag.color"
                    [style.background-color]="selectedTagIdFilter === tag.id ? tag.color : 'transparent'">
              {{ tag.name }}
            </button>
          </div>

          <app-post-skeleton *ngIf="postsLoading" [count]="3"></app-post-skeleton>
          <div *ngIf="!postsLoading && posts.length === 0" class="empty-section">No posts in this community yet.</div>

          <div class="post-list" *ngIf="!postsLoading">
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
                  <div class="meta-top">
                    <a *ngIf="!post.isAnonymous && post.authorUsername"
                       [routerLink]="['/u', post.authorUsername]"
                       class="user-link" (click)="stopPropagation($event)">u/{{ post.authorUsername }}</a>
                    <span *ngIf="post.isAnonymous" class="user-link">Anonymous</span>

                    <span class="flair" [ngClass]="'flair--' + post.postType.toLowerCase()">
                      {{ post.postType }}
                    </span>

                    <span class="timestamp">{{ postLabel(post) }}</span>
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

              <div class="post-tag-container" *ngIf="post.tagName" style="margin-top: 0.25rem; margin-bottom: 0.5rem; display: flex; flex-wrap: wrap;">
                <span class="post-tag-badge" 
                      [style.color]="post.tagColor || 'var(--text-muted)'" 
                      [style.border-color]="post.tagColor || 'var(--border-color)'" 
                      style="font-size: 0.75rem; padding: 0.1rem 0.45rem; border: 1px solid; border-radius: 4px; font-weight: 600; text-transform: uppercase;">
                  {{ post.tagName }}
                </span>
              </div>

              <img *ngIf="firstImage(post)" [src]="firstImage(post)" class="feed-media-preview" alt="Post media" />

              <p class="body-preview">{{ post.content }}</p>

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

                <a [routerLink]="['/posts', post.id]" class="action-pill" title="Comments" (click)="stopPropagation($event)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  <span *ngIf="post.commentCount > 0">{{ post.commentCount }}</span>
                </a>

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
              </div>
            </div>
          </div>

          <div class="pagination" *ngIf="!postsLoading && postsTotalPages > 1">
            <button [disabled]="postsPage === 0" (click)="goToPostsPage(postsPage - 1)">Prev</button>
            <span class="page-info">{{ postsPage + 1 }} / {{ postsTotalPages }}</span>
            <button [disabled]="postsPage >= postsTotalPages - 1" (click)="goToPostsPage(postsPage + 1)">Next</button>
          </div>
        </div>

        <div class="tab-content" *ngIf="activeTab === 'about'">
          <div class="section" *ngIf="rules.length > 0">
            <h3>Rules</h3>
            <div class="rules-list">
              <div class="rule" *ngFor="let r of rules; let i = index">
                <span class="rule-num">{{ i + 1 }}.</span>
                <div>
                  <strong>{{ r.title }}</strong>
                  <p *ngIf="r.description">{{ r.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-content" *ngIf="activeTab === 'members'">
          <div class="section">
            <div class="member-toolbar">
              <input type="text" placeholder="Search members..." [(ngModel)]="memberSearch" (input)="searchMembers()" class="search-input">
              <select [(ngModel)]="memberRoleFilter" (change)="searchMembers()" class="filter-select">
                <option value="">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admins</option>
                <option value="MOD">Moderators</option>
                <option value="MEMBER">Members</option>
              </select>
              <button *ngIf="canInvite()" class="btn-primary" (click)="showInviteModal = true">Invite</button>
            </div>
            <div class="member-list">
              <div class="member" *ngFor="let m of filteredMembers">
                <div class="member-info">
                  <div class="member-avatar" *ngIf="m.avatarUrl">
                    <img [src]="m.avatarUrl" alt="" class="member-avatar-img">
                  </div>
                  <div class="member-avatar member-avatar-fallback" *ngIf="!m.avatarUrl">
                    {{ m.username.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <span class="member-username">&#64;{{ m.username }}</span>
                    <span class="role-tag" [class.owner]="m.role === 'OWNER'" [class.admin]="m.role === 'ADMIN'" [class.mod]="m.role === 'MOD'">{{ m.role }}</span>
                  </div>
                </div>
                <div class="member-actions" *ngIf="canManage() && m.userId !== currentUserId">
                  <div class="member-menu-container">
                    <button class="member-menu-trigger" (click)="toggleMemberMenu(m, $event)" title="Member actions">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="5" r="1.5"></circle>
                        <circle cx="12" cy="12" r="1.5"></circle>
                        <circle cx="12" cy="19" r="1.5"></circle>
                      </svg>
                    </button>

                    <div class="member-dropdown" *ngIf="openMemberMenuId === m.userId" (click)="stopPropagation($event)">
                      <button *ngIf="canPromoteMember(m, 'ADMIN')" class="menu-item" (click)="demoteOrPromoteMember(m, 'ADMIN'); closeMemberMenu()">
                        Promote to Admin
                      </button>
                      <button *ngIf="canPromoteMember(m, 'MOD')" class="menu-item" (click)="demoteOrPromoteMember(m, 'MOD'); closeMemberMenu()">
                        {{ getRoleRank(m.role) > getRoleRank('MOD') ? 'Demote to Moderator' : 'Promote to Moderator' }}
                      </button>
                      <button *ngIf="canPromoteMember(m, 'MEMBER')" class="menu-item" (click)="demoteOrPromoteMember(m, 'MEMBER'); closeMemberMenu()">
                        Demote to Member
                      </button>

                      <div class="menu-divider" *ngIf="(canPromoteMember(m, 'ADMIN') || canPromoteMember(m, 'MOD') || canPromoteMember(m, 'MEMBER')) && (canRemoveMember(m) || canBanMember(m))"></div>

                      <button *ngIf="canRemoveMember(m)" class="menu-item text-danger" (click)="removeMember(m); closeMemberMenu()">
                        Remove from community
                      </button>
                      <button *ngIf="canBanMember(m)" class="menu-item text-danger" (click)="openBanModal(m); closeMemberMenu()">
                        Ban from community
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section" *ngIf="canManage()">
            <h3>Pending Join Requests ({{ joinRequests.length }})</h3>
            <div *ngIf="joinRequests.length === 0" class="empty-section">No pending requests.</div>
            <div class="request-list" *ngIf="joinRequests.length > 0">
              <div class="request" *ngFor="let req of joinRequests">
                <span>&#64;{{ req.username }}</span>
                <div class="request-actions">
                  <button class="btn-sm btn-success" (click)="approveRequest(req.id)">Approve</button>
                  <button class="btn-sm btn-danger" (click)="rejectRequest(req.id)">Reject</button>
                </div>
              </div>
            </div>
          </div>

          <div class="section" *ngIf="canInvite()">
            <h3>Pending Invites</h3>
            <div *ngIf="invites.length === 0" class="empty-section">No pending invites.</div>
            <div class="invite-list" *ngIf="invites.length > 0">
              <div class="invite" *ngFor="let inv of invites">
                <span>&#64;{{ inv.inviteeUsername }}</span>
                <span class="invite-status">{{ inv.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-content" *ngIf="activeTab === 'analytics'">
          <div class="analytics-grid">
            <div class="analytics-card">
              <span class="analytics-value">{{ analytics.totalMembers }}</span>
              <span class="analytics-label">Members</span>
            </div>
            <div class="analytics-card">
              <span class="analytics-value">{{ analytics.totalPosts }}</span>
              <span class="analytics-label">Posts</span>
            </div>
            <div class="analytics-card">
              <span class="analytics-value">{{ analytics.totalComments }}</span>
              <span class="analytics-label">Comments</span>
            </div>
            <div class="analytics-card">
              <span class="analytics-value">{{ analytics.activeAuthors }}</span>
              <span class="analytics-label">Active Authors</span>
            </div>
          </div>
        </div>

        <div class="tab-content" *ngIf="activeTab === 'settings'">
          <div class="section branding-section" *ngIf="canManage()">
            <h3>Branding</h3>
            <div class="branding-grid">
              <div class="branding-item">
                <label>Community Avatar</label>
                <div class="branding-preview">
                  <div class="avatar avatar-lg" *ngIf="editAvatarUrl">
                    <img [src]="editAvatarUrl" alt="" class="avatar-img-lg">
                  </div>
                  <div class="avatar avatar-lg avatar-fallback" *ngIf="!editAvatarUrl">
                    {{ community.name.charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div class="branding-actions">
                  <button class="btn-primary btn-sm" type="button" (click)="avatarInput.click()">Change Avatar</button>
                  <button class="btn-danger-outline btn-sm" type="button" *ngIf="editAvatarUrl" (click)="removeAvatar()">Remove</button>
                </div>
                <input #avatarInput type="file" accept="image/jpeg,image/png,image/gif,image/webp" (change)="onAvatarSelected($event)" hidden>
              </div>
              <div class="branding-item">
                <label>Community Banner</label>
                <div class="branding-preview branding-preview--banner">
                  <img *ngIf="editBannerUrl" [src]="editBannerUrl" alt="" class="banner-preview-img">
                  <div *ngIf="!editBannerUrl" class="banner-preview-fallback"></div>
                </div>
                <div class="branding-actions">
                  <button class="btn-primary btn-sm" type="button" (click)="bannerInput.click()">Change Banner</button>
                  <button class="btn-danger-outline btn-sm" type="button" *ngIf="editBannerUrl" (click)="removeBanner()">Remove</button>
                </div>
                <input #bannerInput type="file" accept="image/jpeg,image/png,image/webp" (change)="onBannerSelected($event)" hidden>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Community Settings</h3>
            <div class="form-group">
              <label for="editName">Name</label>
              <input id="editName" [(ngModel)]="editName" class="form-input">
            </div>
            <div class="form-group">
              <label for="editDesc">Description</label>
              <textarea id="editDesc" [(ngModel)]="editDescription" rows="3" class="form-input"></textarea>
            </div>
            <div class="form-group">
              <label for="editVis">Visibility</label>
              <select id="editVis" [(ngModel)]="editVisibility" class="form-input">
                <option value="PUBLIC">Public</option>
                <option value="RESTRICTED">Restricted</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <button class="btn-primary" (click)="saveSettings()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save Settings' }}</button>
          </div>

          <div class="section" *ngIf="canManage()">
            <h3>Rules</h3>
            <div class="rule-form">
              <input [(ngModel)]="newRuleTitle" placeholder="Rule title" class="form-input">
              <input [(ngModel)]="newRuleDesc" placeholder="Description (optional)" class="form-input">
              <button class="btn-primary btn-sm" (click)="addRule()">Add Rule</button>
            </div>
            <div class="rules-list" *ngIf="rules.length > 0">
              <div class="rule" *ngFor="let r of rules; let i = index">
                <span class="rule-num">{{ i + 1 }}.</span>
                <div>
                  <strong>{{ r.title }}</strong>
                  <p *ngIf="r.description">{{ r.description }}</p>
                </div>
                <button class="btn-danger btn-sm" (click)="deleteRule(r.id)">&times;</button>
              </div>
            </div>
          </div>

          <div class="section" *ngIf="canManage()">
            <h3>Tags ({{ communityTags.length }}/50)</h3>
            <div class="rule-form">
              <input [(ngModel)]="newTagName" placeholder="Tag name (e.g. Project)" class="form-input" style="flex: 2;">
              <select [(ngModel)]="newTagColor" class="form-input" style="flex: 1;">
                <option value="#3B82F6">Blue</option>
                <option value="#8B5CF6">Purple</option>
                <option value="#22C55E">Green</option>
                <option value="#F97316">Orange</option>
                <option value="#EF4444">Red</option>
                <option value="#EC4899">Pink</option>
                <option value="#64748B">Grey</option>
              </select>
              <button class="btn-primary btn-sm" (click)="createTag()" [disabled]="creatingTag">Add Tag</button>
            </div>
            <div class="rules-list" *ngIf="communityTags.length > 0" style="margin-top: 1rem;">
              <div class="rule" *ngFor="let t of communityTags" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--bg-elevated); margin-bottom: 0.4rem; border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <span [style.background-color]="t.color" style="width: 12px; height: 12px; border-radius: 50%; display: inline-block;"></span>
                  <strong [style.color]="t.color">{{ t.name }}</strong>
                </div>
                <button class="btn-danger btn-sm" (click)="deleteTag(t.id)" style="border: none; background: transparent; color: var(--danger); font-size: 1.25rem; padding: 0.2rem 0.5rem; cursor: pointer;">&times;</button>
              </div>
            </div>
          </div>

          <div class="section" *ngIf="canInvite()">
            <h3>Invite Links</h3>
            <div class="form-group">
              <label>Expires in (optional)</label>
              <select [(ngModel)]="newLinkExpires" class="form-input">
                <option value="">Never</option>
                <option value="3600">1 hour</option>
                <option value="86400">24 hours</option>
                <option value="604800">7 days</option>
                <option value="2592000">30 days</option>
              </select>
            </div>
            <div class="form-group">
              <label>Max uses (optional)</label>
              <input type="number" [(ngModel)]="newLinkMaxUses" placeholder="Unlimited" class="form-input">
            </div>
            <button class="btn-primary btn-sm" (click)="createInviteLink()" [disabled]="creatingLink">Generate Link</button>

            <div class="invite-links" *ngIf="inviteLinks.length > 0">
              <div class="invite-link" *ngFor="let l of inviteLinks">
                <code>{{ getInviteUrl(l.code) }}</code>
                <span class="link-stats">{{ l.useCount }}{{ l.maxUses ? '/' + l.maxUses : '' }} uses</span>
                <span class="link-status" [class.active]="l.active" [class.revoked]="!l.active">{{ l.active ? 'Active' : 'Revoked' }}</span>
                <button *ngIf="l.active" class="btn-danger btn-sm" (click)="revokeLink(l.id)">Revoke</button>
              </div>
            </div>
          </div>

          <div class="section" *ngIf="community.role === 'OWNER'">
            <h3>Transfer Ownership</h3>
            <div class="form-group">
              <label>Select new owner</label>
              <select [(ngModel)]="transferTargetId" class="form-input">
                <option value="">Choose a member...</option>
                <option *ngFor="let m of members" [value]="m.userId" [disabled]="m.role === 'OWNER'">&#64;{{ m.username }} ({{ m.role }})</option>
              </select>
            </div>
            <button class="btn-danger" (click)="transferOwnership()" [disabled]="!transferTargetId">Transfer Ownership</button>
          </div>

          <div class="section" *ngIf="canManage()">
            <h3>Banned Users</h3>
            <div *ngIf="bans.length === 0" class="empty-section">No banned users.</div>
            <div class="ban-list" *ngIf="bans.length > 0">
              <div class="ban-item" *ngFor="let b of bans">
                <div class="ban-info">
                  <span>&#64;{{ b.username }}</span>
                  <span class="ban-reason" *ngIf="b.reason">{{ b.reason }}</span>
                  <span class="ban-expires" *ngIf="b.expiresAt && b.active">Expires {{ b.expiresAt | date:'short' }}</span>
                  <span class="ban-expires expired" *ngIf="!b.active">Expired</span>
                </div>
                <button *ngIf="b.active" class="btn-sm btn-secondary" (click)="unbanMember(b.userId)">Unban</button>
              </div>
            </div>
          </div>

          <div class="section" *ngIf="canManage()">
            <h3>Moderation Log</h3>
            <div *ngIf="modLog.length === 0" class="empty-section">No moderation events.</div>
            <div class="mod-log-list" *ngIf="modLog.length > 0">
              <div class="mod-log-item" *ngFor="let l of modLog">
                <span class="mod-action-tag" [class.banned]="l.action === 'MEMBER_BANNED'" [class.unbanned]="l.action === 'MEMBER_UNBANNED'" [class.removed]="l.action === 'MEMBER_REMOVED'" [class.role]="l.action === 'ROLE_CHANGED'">{{ l.action }}</span>
                <span class="mod-log-details">{{ l.details }}</span>
                <span class="mod-log-actor">by &#64;{{ l.actorUsername }}</span>
                <span class="mod-log-time">{{ l.createdAt | date:'short' }}</span>
              </div>
            </div>
          </div>

          <div class="section" *ngIf="community.role === 'OWNER'">
            <h3 class="danger-zone">Danger Zone</h3>
            <p class="text-muted">Delete this community permanently. This cannot be undone.</p>
            <button class="btn-danger" (click)="deleteCommunity()">Delete Community</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="showBanModal" (click)="closeBanModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Ban &#64;{{ banTarget?.username }}</h3>
        <div class="form-group">
          <label>Reason (optional)</label>
          <input [(ngModel)]="banReason" placeholder="Why is this user being banned?" class="form-input">
        </div>
        <div class="form-group">
          <label>Duration</label>
          <select [(ngModel)]="banDuration" class="form-input">
            <option value="">Permanent</option>
            <option value="86400">24 hours</option>
            <option value="604800">7 days</option>
            <option value="2592000">30 days</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="closeBanModal()">Cancel</button>
          <button class="btn-danger" (click)="confirmBan()" [disabled]="banning">Ban</button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="showInviteModal" (click)="showInviteModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Invite User</h3>
        <div class="form-group">
          <input [(ngModel)]="inviteUsername" placeholder="Enter username" class="form-input" (input)="searchUserForInvite()">
          <div class="user-search-results" *ngIf="userSearchResults.length > 0">
            <div class="user-search-item" *ngFor="let u of userSearchResults" (click)="selectUserForInvite(u)">
              <span>&#64;{{ u.username }}</span>
            </div>
          </div>
        </div>
        <div class="selected-user" *ngIf="selectedInviteUser">
          <span>Invite &#64;{{ selectedInviteUser.username }}</span>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="showInviteModal = false">Cancel</button>
          <button class="btn-primary" (click)="sendInvite()" [disabled]="!selectedInviteUser">Send Invite</button>
        </div>
      </div>
    </div>

    <!-- Avatar Crop Modal -->
    <div class="modal-backdrop" *ngIf="showAvatarCrop">
      <div class="modal crop-modal" (click)="$event.stopPropagation()">
        <h3>Adjust Community Avatar</h3>
        <div class="crop-area">
          <image-cropper
            [imageChangedEvent]="avatarChangedEvent"
            [maintainAspectRatio]="true"
            [aspectRatio]="1 / 1"
            format="jpeg"
            [transform]="avatarTransform"
            (imageCropped)="avatarCropped($event)"
            (loadImageFailed)="avatarLoadFailed()">
          </image-cropper>
        </div>
        <div class="zoom-control">
          <label>Zoom</label>
          <input type="range" min="1" max="3" step="0.1" [(ngModel)]="avatarScale" (ngModelChange)="updateAvatarScale()">
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="cancelAvatarCrop()">Cancel</button>
          <button class="btn-primary" (click)="saveAvatarCrop()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- Banner Crop Modal -->
    <div class="modal-backdrop" *ngIf="showBannerCrop">
      <div class="modal crop-modal" (click)="$event.stopPropagation()">
        <h3>Adjust Community Banner</h3>
        <div class="crop-area crop-area--banner">
          <image-cropper
            [imageChangedEvent]="bannerChangedEvent"
            [maintainAspectRatio]="true"
            [aspectRatio]="16 / 9"
            format="jpeg"
            [transform]="bannerTransform"
            (imageCropped)="bannerCropped($event)"
            (loadImageFailed)="bannerLoadFailed()">
          </image-cropper>
        </div>
        <div class="zoom-control">
          <label>Zoom</label>
          <input type="range" min="1" max="3" step="0.1" [(ngModel)]="bannerScale" (ngModelChange)="updateBannerScale()">
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="cancelBannerCrop()">Cancel</button>
          <button class="btn-primary" (click)="saveBannerCrop()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 780px; margin: 2rem auto; padding: 0 1rem; }
    .back-link { color: var(--accent-color); text-decoration: none; font-size: 0.9rem; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { opacity: 0.8; }
    .loading { text-align: center; color: var(--text-muted); padding: 2rem; }
    .error-message { background: rgba(248,113,113,0.1); color: var(--danger); padding: 0.6rem 1rem; margin-bottom: 1rem; font-size: 0.9rem; }
    .banner { width: 100%; height: 200px; overflow: hidden; margin-bottom: 1rem; border-radius: 12px; position: relative; }
    .banner--empty { background: linear-gradient(135deg, var(--primary), #6c5ce7); }
    .banner-fallback { width: 100%; height: 100%; }
    .banner-img { width: 100%; height: 100%; object-fit: cover; }
    .branding-section { }
    .branding-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .branding-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .branding-item label { font-size: 0.85rem; font-weight: 500; color: var(--text-muted); }
    .branding-preview { display: flex; align-items: center; justify-content: center; padding: 1rem; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; min-height: 120px; }
    .branding-preview--banner { min-height: 80px; }
    .branding-actions { display: flex; gap: 0.5rem; }
    .banner-preview-img { max-width: 100%; max-height: 80px; object-fit: cover; border-radius: 4px; }
    .banner-preview-fallback { width: 100%; height: 60px; background: linear-gradient(135deg, var(--primary), #6c5ce7); border-radius: 4px; }
    .avatar-img-lg { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; }
    .crop-modal { max-width: 520px; }
    .crop-area { width: 100%; height: 350px; background: #000; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .crop-area--banner { height: 220px; }
    .zoom-control { display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem; }
    .zoom-control label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; min-width: 40px; }
    .zoom-control input { flex: 1; accent-color: var(--text-main); max-width: 300px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 1rem; flex-wrap: wrap; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header h1 { margin: 0; font-size: 1.5rem; color: var(--text-main); }
    .header-meta { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.3rem; flex-wrap: wrap; }
    .stat { font-size: 0.85rem; color: var(--text-muted); }
    .meta-text { font-size: 0.85rem; color: var(--text-muted); margin: 0 0 1rem; }
    .actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-fallback { display: flex; align-items: center; justify-content: center; background: var(--accent-color); color: white; font-size: 1.5rem; font-weight: 700; }
    .avatar-lg { width: 96px; height: 96px; font-size: 2.25rem; }
    .badge { font-size: 0.75rem; padding: 0.15rem 0.5rem; font-weight: 500; border: 1px solid var(--border-color); }
    .badge.public { border-color: var(--success); color: var(--success); }
    .badge.restricted { border-color: var(--warning); color: var(--warning); }
    .badge.private { border-color: var(--danger); color: var(--danger); }
    .role-badge { font-size: 0.75rem; padding: 0.15rem 0.5rem; font-weight: 500; background: var(--bg-elevated); color: var(--accent-color); border: 1px solid var(--border-color); }
    .description { color: var(--text-muted); margin: 0.5rem 0; }
    .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border-color); margin-bottom: 1rem; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .tabs button { padding: 0.6rem 1rem; font-size: 0.9rem; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: border-color 0.15s; color: var(--text-muted); background: none; white-space: nowrap; }
    .tabs button.active { color: var(--accent-color); border-bottom-color: var(--accent-color); }
    .tabs button:hover { color: var(--text-main); }
    .tab-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .section { }
    .section h3 { margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600; color: var(--text-main); }
    .empty-section { color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 0; }
    .rules-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .rule { display: flex; gap: 0.5rem; align-items: flex-start; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); }
    .rule:last-child { border-bottom: none; }
    .rule-num { color: var(--text-muted); font-weight: 500; min-width: 1.5rem; }
    .rule strong { font-size: 0.9rem; }
    .rule p { margin: 0.2rem 0 0; font-size: 0.85rem; color: var(--text-muted); }
    .member-toolbar { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 160px; padding: 0.45rem 0.6rem; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main); font-size: 0.85rem; }
    .filter-select { padding: 0.45rem 0.6rem; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main); font-size: 0.85rem; }
    .member-list { display: flex; flex-direction: column; gap: 0.3rem; }
    .member { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.6rem; background: var(--bg-elevated); }
    .member:hover { background: var(--bg-hover); }
    .member-info { display: flex; align-items: center; gap: 0.6rem; }
    .member-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
    .member-avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .member-avatar-fallback { display: flex; align-items: center; justify-content: center; background: var(--accent-color); color: white; font-size: 0.85rem; font-weight: 600; }
    .member-username { font-weight: 500; font-size: 0.9rem; color: var(--text-main); margin-right: 0.5rem; }
    .member-actions { display: flex; gap: 0.4rem; align-items: center; }
    .role-tag { font-size: 0.7rem; padding: 0.1rem 0.4rem; font-weight: 500; border: 1px solid var(--border-color); }
    .role-tag.owner { border-color: var(--danger); color: var(--danger); }
    .role-tag.admin { border-color: var(--accent-color); color: var(--accent-color); }
    .role-tag.mod { border-color: var(--success); color: var(--success); }
    .role-select { padding: 0.3rem 0.4rem; font-size: 0.8rem; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main); }
    .request-list { display: flex; flex-direction: column; gap: 0.4rem; }
    .request { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.6rem; background: var(--bg-elevated); font-size: 0.9rem; }
    .request-actions { display: flex; gap: 0.4rem; }
    .invite-list { display: flex; flex-direction: column; gap: 0.4rem; }
    .invite { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.6rem; background: var(--bg-elevated); font-size: 0.9rem; }
    .invite-status { font-size: 0.8rem; color: var(--text-muted); }
    .form-group { margin-bottom: 0.75rem; }
    .form-group label { display: block; margin-bottom: 0.3rem; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); }
    .form-input { width: 100%; padding: 0.5rem 0.6rem; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main); font-size: 0.9rem; box-sizing: border-box; }
    .form-input:focus { outline: none; border-color: var(--accent-color); }
    .file-input { font-size: 0.85rem; margin-top: 0.3rem; }
    .avatar-upload { display: flex; align-items: center; gap: 1rem; }
    .btn-primary { padding: 0.5rem 1rem; background: var(--accent-color); color: white; font-size: 0.85rem; font-weight: 600; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-primary:disabled { opacity: 0.5; }
    .btn-secondary { padding: 0.5rem 1rem; background: var(--bg-elevated); color: var(--text-main); font-size: 0.85rem; border: 1px solid var(--border-color); }
    .btn-danger { padding: 0.5rem 1rem; background: var(--danger); color: white; font-size: 0.85rem; font-weight: 600; }
    .btn-danger-outline { padding: 0.5rem 1rem; background: none; color: var(--danger); font-size: 0.85rem; border: 1px solid var(--danger); }
    .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.8rem; }
    .btn-success { background: var(--success); color: white; }
    .text-muted { color: var(--text-muted); font-size: 0.85rem; }
    .danger-zone { color: var(--danger); }
    .invite-links { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.75rem; }
    .invite-link { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0.6rem; background: var(--bg-elevated); font-size: 0.85rem; flex-wrap: wrap; }
    .invite-link code { font-size: 0.8rem; color: var(--accent-color); word-break: break-all; flex: 1; }
    .link-stats { color: var(--text-muted); font-size: 0.8rem; }
    .link-status { font-size: 0.75rem; padding: 0.1rem 0.35rem; }
    .link-status.active { color: var(--success); }
    .link-status.revoked { color: var(--danger); }
    .rule-form { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .rule-form input { flex: 1; min-width: 120px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal { background: var(--bg-main); padding: 1.5rem; min-width: 360px; max-width: 90vw; }
    .modal h3 { margin: 0 0 0.75rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
    .selected-user { padding: 0.4rem 0.6rem; background: var(--bg-elevated); font-size: 0.9rem; }
    .user-search-results { border: 1px solid var(--border-color); border-top: none; max-height: 160px; overflow-y: auto; }
    .user-search-item { padding: 0.4rem 0.6rem; cursor: pointer; font-size: 0.9rem; }
    .user-search-item:hover { background: var(--bg-hover); }
    .member-actions-inner { display: inline-flex; gap: 0.3rem; align-items: center; }
    .btn-danger-outline { background: none; border: 1px solid var(--danger); color: var(--danger); }
    .ban-list { display: flex; flex-direction: column; gap: 0.4rem; }
    .ban-item { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.6rem; background: var(--bg-elevated); font-size: 0.85rem; }
    .ban-info { display: flex; flex-direction: column; gap: 0.15rem; }
    .ban-reason { color: var(--text-muted); font-size: 0.8rem; }
    .ban-expires { font-size: 0.75rem; color: var(--text-muted); }
    .ban-expires.expired { color: var(--danger); }
    .mod-log-list { display: flex; flex-direction: column; gap: 0.3rem; }
    .mod-log-item { display: flex; gap: 0.5rem; align-items: center; padding: 0.35rem 0.5rem; background: var(--bg-elevated); font-size: 0.8rem; flex-wrap: wrap; }
    .mod-action-tag { font-size: 0.7rem; padding: 0.1rem 0.35rem; font-weight: 500; }
    .mod-action-tag.banned { color: var(--danger); border: 1px solid var(--danger); }
    .mod-action-tag.unbanned { color: var(--success); border: 1px solid var(--success); }
    .mod-action-tag.removed { color: var(--danger); border: 1px solid var(--danger); }
    .mod-action-tag.role { color: var(--accent-color); border: 1px solid var(--accent-color); }
    .mod-log-details { flex: 1; min-width: 120px; }
    .mod-log-actor { color: var(--text-muted); white-space: nowrap; }
    .mod-log-time { color: var(--text-muted); font-size: 0.75rem; white-space: nowrap; }
    .analytics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
    .analytics-card { display: flex; flex-direction: column; align-items: center; padding: 1rem; background: var(--bg-elevated); }
    .analytics-value { font-size: 1.75rem; font-weight: 700; color: var(--accent-color); }
    .analytics-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; }

    .member-menu-container { position: relative; display: inline-block; }
    .member-menu-trigger { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.4rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background-color 0.15s, color 0.15s; width: 36px; height: 36px; }
    .member-menu-trigger:hover { background-color: var(--bg-hover); color: var(--text-main); }
    .member-dropdown { position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 240px; z-index: 1000; overflow: hidden; display: flex; flex-direction: column; padding: 0.5rem 0; }
    .member-dropdown .menu-item { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem 1.25rem; background: transparent; border: none; color: var(--text-main); font-size: 0.95rem; font-weight: 500; text-align: left; cursor: pointer; text-decoration: none; transition: background-color 0.1s; }
    .member-dropdown .menu-item:hover:not(.disabled) { background-color: var(--bg-hover); }
    .member-dropdown .menu-item.disabled { opacity: 0.5; cursor: not-allowed; }
    .member-dropdown .text-danger { color: var(--danger); }
    .member-dropdown .text-danger:hover { background-color: rgba(239, 68, 68, 0.1); }
    .member-dropdown .menu-divider { height: 1px; background-color: var(--border-color); margin: 0.5rem 0; }

    .post-type-filters { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filter-pill { padding: 0.35rem 0.85rem; border-radius: 9999px; background: var(--bg-elevated); border: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background-color 0.15s, color 0.15s; }
    .filter-pill:hover { background: var(--bg-hover); color: var(--text-main); }
    .filter-pill.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }

    @media (max-width: 768px) {
      .container { margin: 1rem auto; }
      .banner { height: 100px; }
      .header { flex-direction: column; align-items: center; gap: 0.5rem; }
      .header-left {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.25rem;
        margin-top: -32px;
      }
      .header h1 { font-size: 1.125rem; margin-top: 0; }
      .header-meta { justify-content: center; font-size: 0.75rem; }
      .community-slug { display: none; }
      .description { text-align: center; }
      .meta-text { text-align: center; }
      .actions { width: 100%; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; }
      .actions .btn-primary,
      .actions .btn-secondary,
      .actions .btn-danger-outline { width: 100%; text-align: center; }

      .tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; }
      .tabs::-webkit-scrollbar { display: none; }
      .tabs button { min-width: 72px; font-size: 0.8125rem; padding: 0.5rem 0.75rem; }

      .post-type-filters { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; gap: 0.35rem; }
      .post-type-filters::-webkit-scrollbar { display: none; }
      .tag-filters { flex-wrap: nowrap !important; overflow-x: auto; -webkit-overflow-scrolling: touch; }

      .post-item { padding: 0.75rem 0; }
      .post-item:hover { padding-left: 0.5rem; padding-right: 0.5rem; margin-left: -0.5rem; margin-right: -0.5rem; }
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

      .member { flex-wrap: nowrap; padding: 0.5rem; }
      .member-avatar { width: 36px; height: 36px; }
      .member-avatar-img { width: 36px; height: 36px; }
      .member-avatar-fallback { width: 36px; height: 36px; font-size: 0.85rem; }
      .member-toolbar { flex-direction: column; }
      .search-input { min-width: auto; width: 100%; }

      .branding-grid { grid-template-columns: 1fr; }
      .rule-form { flex-direction: column; gap: 0.4rem; }
      .rule-form input { width: 100%; min-width: auto; }
      .avatar-lg { width: 72px; height: 72px; font-size: 1.75rem; }
      .avatar-img-lg { width: 72px; height: 72px; }

      .modal { min-width: auto; width: calc(100% - 2rem); max-width: 100%; padding: 1rem; }
      .crop-area { height: 250px; }
      .crop-area--banner { height: 160px; }

      .ban-item { flex-wrap: wrap; gap: 0.5rem; }
      .invite-link { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
      .mod-log-item { flex-wrap: wrap; }
      .analytics-grid { grid-template-columns: repeat(2, 1fr); }
      .analytics-value { font-size: 1.5rem; }
    }

    .post-list { display: flex; flex-direction: column; }
    .post-item { padding: 2rem 0; border-bottom: 1px solid var(--border-color); transition: all 0.15s; border-radius: 12px; }
    .post-item:first-child { padding-top: 0; }
    .post-item:hover { background-color: var(--bg-hover); padding-left: 1rem; padding-right: 1rem; margin-left: -1rem; margin-right: -1rem; border-color: transparent; }
    .post-meta { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem; }
    .meta-text { display: flex; flex-direction: column; justify-content: center; line-height: 1.2; }
    .meta-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .user-link { color: var(--text-main); font-weight: 600; font-size: 0.95rem; }
    .timestamp { color: var(--text-muted); font-size: 0.8rem; }
    .flair { display: inline-flex; align-items: center; gap: 4px; border: none; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 9999px; text-transform: capitalize; letter-spacing: 0; background-color: var(--bg-elevated); color: var(--text-main); }
    .flair--job { background-color: #dcfce7; color: #166534; }
    .flair--achievement { background-color: #fef08a; color: #854d0e; }
    .flair--project { background-color: #e0e7ff; color: #3730a3; }
    .flair--general { background-color: #e2e8f0; color: #475569; }
    .avatar-img, .avatar-initials { height: 40px; width: 40px; border-radius: 50%; object-fit: cover; }
    .avatar-initials { background: var(--text-main); color: var(--bg-main); display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; }
    .avatar-anon { background: var(--border-color); color: var(--text-muted); }
    .title { color: var(--text-main); display: block; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.5rem; text-decoration: none; line-height: 1.2; }
    .title:hover { color: var(--accent-color); }
    .body-preview { color: var(--text-muted); display: -webkit-box; font-size: 0.95rem; -webkit-line-clamp: 3; line-height: 1.6; margin: 0 0 1rem; overflow: hidden; -webkit-box-orient: vertical; }
    .feed-media-preview { width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin-bottom: 1rem; border: 1px solid var(--border-color); }
    .action-bar { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; }
    .action-pill { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.5rem 0.8rem; border-radius: 9999px; background: transparent; border: 1px solid transparent; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; transition: background-color 0.15s, color 0.15s, border-color 0.15s; min-width: 44px; min-height: 44px; user-select: none; }
    .action-pill:hover { background-color: var(--bg-hover); color: var(--text-main); }
    .action-pill.active-like { color: var(--primary); background-color: rgba(var(--primary-rgb), 0.1); box-shadow: 0 0 8px rgba(var(--primary-rgb), 0.4); }
    .action-pill.active-like:hover { background-color: rgba(var(--primary-rgb), 0.2); }
    .action-pill.active-dislike { color: #e74c3c; background-color: rgba(231, 76, 60, 0.1); box-shadow: 0 0 8px rgba(231, 76, 60, 0.4); }
    .action-pill.active-dislike:hover { background-color: rgba(231, 76, 60, 0.2); }
    .action-pill.active-save { color: var(--accent-color); background-color: rgba(var(--primary-rgb), 0.1); }
    .action-pill.active-save:hover { background-color: rgba(var(--primary-rgb), 0.2); }
    .pagination { display: flex; align-items: center; gap: 1rem; justify-content: center; margin-top: 3rem; border-top: 1px solid var(--border-color); padding-top: 2rem; }
    .pagination button { background: transparent; border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.85rem; font-weight: 600; padding: 0.5rem 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .pagination button:disabled { opacity: 0.3; border-color: transparent; }
    .pagination button:hover:not(:disabled) { border-color: var(--text-main); }
    .page-info { color: var(--text-muted); font-size: 0.85rem; font-weight: 500; }
    .desktop-text { display: inline; }


  `]
})
export class CommunityDetailComponent implements OnInit {
  community: CommunityResponse | null = null;
  members: CommunityMemberResponse[] = [];
  filteredMembers: CommunityMemberResponse[] = [];
  invites: InviteResponse[] = [];
  rules: CommunityRuleResponse[] = [];
  joinRequests: JoinRequestResponse[] = [];
  inviteLinks: InviteLinkResponse[] = [];
  myJoinRequest: JoinRequestResponse | null = null;
  loading = false;
  error = '';
  loadedImages = new Set<string>();

  onImageLoaded(url: string): void {
    this.loadedImages.add(url);
  }

  isImageLoaded(url: string): boolean {
    return this.loadedImages.has(url);
  }
  saving = false;
  creatingLink = false;
  activeTab: 'about' | 'posts' | 'members' | 'settings' | 'analytics' = 'posts';
  memberSearch = '';
  memberRoleFilter = '';
  selectedPostTypeFilter = '';
  selectedTagIdFilter: string | null = null;
  communityTags: CommunityTagResponse[] = [];
  newTagName = '';
  newTagColor = '#3B82F6';
  creatingTag = false;
  currentUserId = '';
  bans: BanResponse[] = [];
  modLog: ModLogResponse[] = [];
  openMemberMenuId: string | null = null;
  showBanModal = false;
  banTarget: CommunityMemberResponse | null = null;
  banReason = '';
  banDuration = '';
  banning = false;
  analytics: CommunityAnalyticsResponse = { totalMembers: 0, totalPosts: 0, totalComments: 0, activeAuthors: 0 };

  posts: FeedPostResponse[] = [];
  postsLoading = false;
  postsPage = 0;
  postsTotalPages = 0;

  editName = '';
  editDescription = '';
  editVisibility = 'PUBLIC';
  editAvatarUrl = '';
  editBannerUrl = '';

  showAvatarCrop = false;
  avatarChangedEvent: any = null;
  avatarCroppedBlob: Blob | null | undefined = null;
  avatarScale = 1;
  avatarTransform = { scale: 1 };

  showBannerCrop = false;
  bannerChangedEvent: any = null;
  bannerCroppedBlob: Blob | null | undefined = null;
  bannerScale = 1;
  bannerTransform = { scale: 1 };

  newRuleTitle = '';
  newRuleDesc = '';

  newLinkExpires = '';
  newLinkMaxUses: number | null = null;

  showInviteModal = false;
  inviteUsername = '';
  userSearchResults: any[] = [];
  selectedInviteUser: any = null;

  transferTargetId = '';

  private communityId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private communityService: CommunityService,
    private userService: UserService,
    private authService: AuthService,
    private postService: PostService,
    private toastService: ToastService,
    private anonymousBrowsingService: AnonymousBrowsingService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code');
    const id = this.route.snapshot.paramMap.get('id');
    const slug = this.route.snapshot.paramMap.get('slug');

    if (code) {
      this.communityService.joinByLink(code).subscribe({
        next: () => this.router.navigate(['/communities']),
        error: (err) => {
          this.error = err.error?.error || 'Invalid or expired invite link.';
          this.loading = false;
        }
      });
      return;
    }

    this.authService.currentUser$.subscribe(user => {
      if (user) this.currentUserId = user.id;
    });

    if (id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(id)) {
        this.communityId = id;
        this.loadCommunity();
      } else {
        this.router.navigate(['/c', id], { replaceUrl: true });
      }
    } else if (slug) {
      this.loadCommunityBySlug(slug);
    } else {
      this.error = 'Community not found.';
    }
  }

  toggleMemberMenu(m: CommunityMemberResponse, event: Event): void {
    event.stopPropagation();
    this.openMemberMenuId = this.openMemberMenuId === m.userId ? null : m.userId;
  }

  closeMemberMenu(): void {
    this.openMemberMenuId = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.closeMemberMenu();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    this.closeMemberMenu();
  }

  getRoleRank(role: string | undefined): number {
    if (!role) return 0;
    if (role === 'OWNER') return 4;
    if (role === 'ADMIN') return 3;
    if (role === 'MOD') return 2;
    if (role === 'MEMBER') return 1;
    return 0;
  }

  canRemoveMember(m: CommunityMemberResponse): boolean {
    if (!this.community || !this.canManage()) return false;
    if (m.userId === this.currentUserId) return false;
    return this.getRoleRank(this.community.role) > this.getRoleRank(m.role);
  }

  canBanMember(m: CommunityMemberResponse): boolean {
    if (!this.community || !this.canManage()) return false;
    if (m.userId === this.currentUserId) return false;
    return this.getRoleRank(this.community.role) > this.getRoleRank(m.role);
  }

  canPromoteMember(m: CommunityMemberResponse, newRole: 'ADMIN' | 'MOD' | 'MEMBER'): boolean {
    if (!this.community || !this.canManage()) return false;
    if (m.userId === this.currentUserId) return false;
    if (m.role === 'OWNER') return false;
    if (m.role === newRole) return false;

    const myRank = this.getRoleRank(this.community.role);
    const targetRank = this.getRoleRank(m.role);
    const newRank = this.getRoleRank(newRole);

    return myRank > targetRank && myRank > newRank;
  }

  onPromoteRequested(event: { targetMember: CommunityMemberResponse; newRole: 'ADMIN' | 'MOD' | 'MEMBER' }): void {
    this.demoteOrPromoteMember(event.targetMember, event.newRole);
  }

  onRemoveRequested(event: CommunityMemberResponse): void {
    this.removeMember(event);
  }

  onBanRequested(event: CommunityMemberResponse): void {
    this.openBanModal(event);
  }

  onCloseMenuRequested(): void {
    this.closeMemberMenu();
  }

  loadCommunity(): void {
    this.loading = true;
    this.error = '';
    this.communityService.getById(this.communityId).subscribe({
      next: (community) => {
        this.community = community;
        this.editName = community.name;
        this.editDescription = community.description || '';
        this.editVisibility = community.visibility;
        this.editAvatarUrl = community.avatarUrl || '';
        this.editBannerUrl = community.bannerUrl || '';
        this.loading = false;
        
        // Redirect to the canonical /c/:slug URL
        this.router.navigate(['/c', community.slug], { replaceUrl: true });

        this.onCommunityLoaded();
      },
      error: () => {
        this.error = 'Failed to load community.';
        this.loading = false;
      }
    });
  }

  loadCommunityBySlug(slug: string): void {
    this.loading = true;
    this.error = '';
    this.communityService.getBySlug(slug).subscribe({
      next: (community) => {
        this.community = community;
        this.communityId = community.id;
        this.editName = community.name;
        this.editDescription = community.description || '';
        this.editVisibility = community.visibility;
        this.editAvatarUrl = community.avatarUrl || '';
        this.editBannerUrl = community.bannerUrl || '';
        this.loading = false;

        this.onCommunityLoaded();
      },
      error: () => {
        this.error = 'Failed to load community.';
        this.loading = false;
      }
    });
  }

  onCommunityLoaded(): void {
    this.loadMembers();
    this.loadRules();
    this.loadJoinRequests();
    this.loadInviteLinks();
    this.loadBans();
    this.loadModLog();
    this.loadAnalytics();
    this.loadPosts();
    this.loadCommunityTags();
    if (this.community && this.community.role !== 'NONE') {
      this.loadInvites();
      this.loadMyJoinRequest();
    }
  }

  loadMembers(): void {
    this.communityService.getMembers(this.communityId).subscribe({
      next: (members) => {
        this.members = members;
        this.searchMembers();
      }
    });
  }

  loadInvites(): void {
    this.communityService.getInvites(this.communityId).subscribe({
      next: (invites) => this.invites = invites
    });
  }

  loadRules(): void {
    this.communityService.getRules(this.communityId).subscribe({
      next: (rules) => this.rules = rules
    });
  }

  loadJoinRequests(): void {
    this.communityService.getJoinRequests(this.communityId).subscribe({
      next: (requests) => this.joinRequests = requests
    });
  }

  loadMyJoinRequest(): void {
    this.communityService.getMyJoinRequest(this.communityId).subscribe({
      next: (req) => this.myJoinRequest = req
    });
  }

  loadInviteLinks(): void {
    this.communityService.getInviteLinks(this.communityId).subscribe({
      next: (links) => this.inviteLinks = links
    });
  }

  loadBans(): void {
    if (!this.canManage()) return;
    this.communityService.getBans(this.communityId).subscribe({
      next: (bans) => this.bans = bans
    });
  }

  loadModLog(): void {
    if (!this.canManage()) return;
    this.communityService.getModLog(this.communityId).subscribe({
      next: (log) => this.modLog = log
    });
  }

  loadAnalytics(): void {
    if (this.community?.role !== 'OWNER' && this.community?.role !== 'ADMIN') return;
    this.communityService.getAnalytics(this.communityId).subscribe({
      next: (a) => this.analytics = a
    });
  }

  loadPosts(): void {
    this.postsLoading = true;
    let url = `${environment.apiUrl}/posts/communities/${this.communityId}/posts?page=${this.postsPage}&size=20`;
    if (this.selectedPostTypeFilter) {
      url += `&type=${this.selectedPostTypeFilter}`;
    }
    if (this.selectedTagIdFilter) {
      url += `&tagId=${this.selectedTagIdFilter}`;
    }
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.posts = res.content;
        this.postsTotalPages = res.totalPages;
        this.postsLoading = false;
      },
      error: () => this.postsLoading = false
    });
  }

  setPostTypeFilter(type: string): void {
    this.selectedPostTypeFilter = type;
    this.postsPage = 0;
    this.loadPosts();
  }

  canCreatePost(): boolean {
    if (!this.community || !this.community.isMember) {
      return false;
    }
    if (this.community.visibility === 'RESTRICTED') {
      return this.community.role === 'OWNER' || 
             this.community.role === 'ADMIN' || 
             this.community.role === 'MOD';
    }
    return true;
  }

  navigateToCreatePost(): void {
    this.router.navigate(['/posts/new'], { queryParams: { communityId: this.communityId } });
  }

  setTagIdFilter(tagId: string | null): void {
    this.selectedTagIdFilter = tagId;
    this.postsPage = 0;
    this.loadPosts();
  }

  loadCommunityTags(): void {
    this.communityService.getTags(this.communityId).subscribe({
      next: (tags) => {
        this.communityTags = tags;
      },
      error: () => {}
    });
  }

  createTag(): void {
    if (!this.newTagName.trim()) return;
    this.creatingTag = true;
    this.communityService.createTag(this.communityId, {
      name: this.newTagName.trim(),
      color: this.newTagColor
    }).subscribe({
      next: (tag) => {
        this.toastService.showSuccess('Tag created successfully');
        this.newTagName = '';
        this.newTagColor = '#3B82F6';
        this.creatingTag = false;
        this.loadCommunityTags();
      },
      error: (err) => {
        this.toastService.showError(err.error?.message || 'Failed to create tag');
        this.creatingTag = false;
      }
    });
  }

  deleteTag(tagId: string): void {
    if (!confirm('Are you sure you want to delete this tag? Posts using this tag will keep their posts but lose the tag.')) {
      return;
    }
    this.communityService.deleteTag(this.communityId, tagId).subscribe({
      next: () => {
        this.toastService.showSuccess('Tag deleted successfully');
        this.loadCommunityTags();
        if (this.selectedTagIdFilter === tagId) {
          this.setTagIdFilter(null);
        } else {
          this.loadPosts();
        }
      },
      error: (err) => {
        this.toastService.showError(err.error?.message || 'Failed to delete tag');
      }
    });
  }

  switchToPosts(): void {
    this.activeTab = 'posts';
    if (this.posts.length === 0 && !this.postsLoading) {
      this.loadPosts();
    }
  }

  goToPostsPage(p: number): void {
    this.postsPage = p;
    this.loadPosts();
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
    optimisticToggleVote(event, post, direction, this.postService);
  }

  toggleSave(event: Event, post: FeedPostResponse): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    optimisticToggleSave(event, post, this.postService);
  }

  sharePost(event: Event, post: FeedPostResponse): void {
    event.stopPropagation();
    event.preventDefault();

    const url = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Community Post',
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.toastService.showSuccess('Link copied to clipboard');
      });
    }
  }

  searchMembers(): void {
    const search = this.memberSearch.toLowerCase();
    const role = this.memberRoleFilter;
    this.filteredMembers = this.members.filter(m => {
      if (search && !m.username.toLowerCase().includes(search)) return false;
      if (role && m.role !== role) return false;
      return true;
    });
  }

  switchToMembers(): void {
    this.activeTab = 'members';
    this.searchMembers();
  }

  canManage(): boolean {
    return this.community?.role === 'OWNER' || this.community?.role === 'ADMIN' || this.community?.role === 'MOD';
  }

  canInvite(): boolean {
    return this.community?.role === 'OWNER' || this.community?.role === 'ADMIN';
  }

  canManageRoles(): boolean {
    return this.community?.role === 'OWNER' || this.community?.role === 'ADMIN';
  }

  joinCommunity(): void {
    this.communityService.join(this.communityId).subscribe({
      next: () => this.loadCommunity(),
      error: (err) => this.error = err.error?.error || 'Failed to join.'
    });
  }

  leaveCommunity(): void {
    this.communityService.leave(this.communityId).subscribe({
      next: () => this.router.navigate(['/communities']),
      error: (err) => this.error = err.error?.error || 'Failed to leave.'
    });
  }

  deleteCommunity(): void {
    if (!confirm('Delete this community? This cannot be undone.')) return;
    this.communityService.delete(this.communityId).subscribe({
      next: () => this.router.navigate(['/communities']),
      error: (err) => this.error = err.error?.error || 'Failed to delete.'
    });
  }

  saveSettings(): void {
    this.saving = true;
    this.error = '';
    this.communityService.update(this.communityId, {
      name: this.editName || undefined,
      description: this.editDescription || undefined,
      visibility: this.editVisibility,
      avatarUrl: this.editAvatarUrl || undefined,
      bannerUrl: this.editBannerUrl || undefined
    }).subscribe({
      next: (c) => {
        this.community = c;
        this.saving = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to save settings.';
        this.saving = false;
      }
    });
  }

  // --- Avatar crop flow ---
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { this.error = 'Unsupported file type.'; input.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { this.error = 'File exceeds the 5MB limit.'; input.value = ''; return; }
    this.avatarChangedEvent = event;
    this.avatarScale = 1;
    this.avatarTransform = { scale: 1 };
    this.showAvatarCrop = true;
  }

  avatarCropped(event: ImageCroppedEvent): void {
    this.avatarCroppedBlob = event.blob;
  }

  avatarLoadFailed(): void {
    this.error = 'Failed to load image for cropping.';
    this.cancelAvatarCrop();
  }

  updateAvatarScale(): void {
    this.avatarTransform = { ...this.avatarTransform, scale: this.avatarScale };
  }

  cancelAvatarCrop(): void {
    this.showAvatarCrop = false;
    this.avatarChangedEvent = null;
    this.avatarCroppedBlob = null;
  }

  async saveAvatarCrop(): Promise<void> {
    if (!this.avatarCroppedBlob) return;
    this.saving = true;
    try {
      const file = new File([this.avatarCroppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', 'avatars');
      const res = await this.http.post<{ url: string }>(`${environment.apiUrl}/storage/upload`, formData).toPromise();
      if (res && res.url) {
        this.editAvatarUrl = res.url;
      }
    } catch {
      this.error = 'Failed to upload avatar.';
    }
    this.saving = false;
    this.cancelAvatarCrop();
  }

  removeAvatar(): void {
    if (!confirm('Remove community avatar?')) return;
    this.communityService.update(this.communityId, { avatarUrl: '' }).subscribe({
      next: (c) => {
        this.community = c;
        this.editAvatarUrl = c.avatarUrl || '';
      },
      error: (err) => this.error = err.error?.error || 'Failed to remove avatar.'
    });
  }

  // --- Banner crop flow ---
  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { this.error = 'Unsupported file type.'; input.value = ''; return; }
    if (file.size > 10 * 1024 * 1024) { this.error = 'File exceeds the 10MB limit.'; input.value = ''; return; }
    this.bannerChangedEvent = event;
    this.bannerScale = 1;
    this.bannerTransform = { scale: 1 };
    this.showBannerCrop = true;
  }

  bannerCropped(event: ImageCroppedEvent): void {
    this.bannerCroppedBlob = event.blob;
  }

  bannerLoadFailed(): void {
    this.error = 'Failed to load image for cropping.';
    this.cancelBannerCrop();
  }

  updateBannerScale(): void {
    this.bannerTransform = { ...this.bannerTransform, scale: this.bannerScale };
  }

  cancelBannerCrop(): void {
    this.showBannerCrop = false;
    this.bannerChangedEvent = null;
    this.bannerCroppedBlob = null;
  }

  async saveBannerCrop(): Promise<void> {
    if (!this.bannerCroppedBlob) return;
    this.saving = true;
    try {
      const file = new File([this.bannerCroppedBlob], 'banner.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', 'banners');
      const res = await this.http.post<{ url: string }>(`${environment.apiUrl}/storage/upload`, formData).toPromise();
      if (res && res.url) {
        this.editBannerUrl = res.url;
      }
    } catch {
      this.error = 'Failed to upload banner.';
    }
    this.saving = false;
    this.cancelBannerCrop();
  }

  removeBanner(): void {
    if (!confirm('Remove community banner?')) return;
    this.communityService.update(this.communityId, { bannerUrl: '' }).subscribe({
      next: (c) => {
        this.community = c;
        this.editBannerUrl = c.bannerUrl || '';
      },
      error: (err) => this.error = err.error?.error || 'Failed to remove banner.'
    });
  }

  addRule(): void {
    if (!this.newRuleTitle.trim()) return;
    this.communityService.createRule(this.communityId, {
      title: this.newRuleTitle.trim(),
      description: this.newRuleDesc.trim() || undefined,
      position: this.rules.length
    }).subscribe({
      next: () => {
        this.newRuleTitle = '';
        this.newRuleDesc = '';
        this.loadRules();
      },
      error: (err) => this.error = err.error?.error || 'Failed to add rule.'
    });
  }

  deleteRule(ruleId: string): void {
    this.communityService.deleteRule(this.communityId, ruleId).subscribe({
      next: () => this.loadRules()
    });
  }

  approveRequest(requestId: string): void {
    this.communityService.approveJoinRequest(this.communityId, requestId).subscribe({
      next: () => {
        this.loadJoinRequests();
        this.loadMembers();
      }
    });
  }

  rejectRequest(requestId: string): void {
    this.communityService.rejectJoinRequest(this.communityId, requestId).subscribe({
      next: () => this.loadJoinRequests()
    });
  }

  createInviteLink(): void {
    this.creatingLink = true;
    let expiresAt: string | undefined;
    if (this.newLinkExpires) {
      expiresAt = new Date(Date.now() + parseInt(this.newLinkExpires) * 1000).toISOString();
    }
    this.communityService.createInviteLink(this.communityId, {
      expiresAt,
      maxUses: this.newLinkMaxUses || undefined
    }).subscribe({
      next: () => {
        this.newLinkExpires = '';
        this.newLinkMaxUses = null;
        this.creatingLink = false;
        this.loadInviteLinks();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to create link.';
        this.creatingLink = false;
      }
    });
  }

  revokeLink(linkId: string): void {
    this.communityService.revokeInviteLink(this.communityId, linkId).subscribe({
      next: () => this.loadInviteLinks()
    });
  }

  getInviteUrl(code: string): string {
    return window.location.origin + '/communities/join/' + code;
  }

  searchUserForInvite(): void {
    const q = this.inviteUsername.trim();
    if (q.length < 2) { this.userSearchResults = []; return; }
    this.userService.searchUsers(q).subscribe({
      next: (results) => {
        this.userSearchResults = results.filter((u: any) =>
          !this.members.some(m => m.userId === u.id)
        );
      }
    });
  }

  selectUserForInvite(user: any): void {
    this.selectedInviteUser = user;
    this.inviteUsername = user.username;
    this.userSearchResults = [];
  }

  sendInvite(): void {
    if (!this.selectedInviteUser) return;
    this.communityService.invite(this.communityId, this.selectedInviteUser.id).subscribe({
      next: () => {
        this.showInviteModal = false;
        this.selectedInviteUser = null;
        this.inviteUsername = '';
        this.loadInvites();
      },
      error: (err) => this.error = err.error?.error || 'Failed to send invite.'
    });
  }

  canPromoteAdmin(): boolean {
    return this.community?.role === 'OWNER';
  }

  promoteMember(member: CommunityMemberResponse, newRole: 'ADMIN' | 'MOD'): void {
    if (!confirm(`Promote @${member.username} to ${newRole === 'ADMIN' ? 'Admin' : 'Moderator'}?`)) return;
    this.demoteOrPromoteMember(member, newRole);
  }

  demoteOrPromoteMember(member: CommunityMemberResponse, newRole: 'ADMIN' | 'MOD' | 'MEMBER'): void {
    const action = member.role + ' → ' + newRole;
    if (!confirm(`Change @${member.username} role from ${action}?`)) return;
    this.communityService.updateMemberRole(this.communityId, member.userId, { role: newRole }).subscribe({
      next: () => {
        this.loadMembers();
        this.toastService.showSuccess('Member role updated');
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to update role.';
        this.toastService.showError('Failed to update role');
      }
    });
  }

  changeMemberRole(member: CommunityMemberResponse, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newRole = select.value;
    if (!newRole) return;
    const action = member.role + ' → ' + newRole;
    if (!confirm('Change @' + member.username + ' role from ' + action + '?')) {
      select.value = '';
      return;
    }
    this.communityService.updateMemberRole(this.communityId, member.userId, { role: newRole }).subscribe({
      next: () => {
        select.value = '';
        this.loadMembers();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to update role.';
        select.value = '';
      }
    });
  }

  transferOwnership(): void {
    if (!this.transferTargetId) return;
    if (!confirm('Transfer ownership? You will become an admin.')) return;
    this.communityService.transferOwnership(this.communityId, this.transferTargetId).subscribe({
      next: () => {
        this.transferTargetId = '';
        this.loadCommunity();
      },
      error: (err) => this.error = err.error?.error || 'Failed to transfer ownership.'
    });
  }

  removeMember(member: CommunityMemberResponse): void {
    if (!confirm('Remove @' + member.username + ' from this community?')) return;
    this.communityService.removeMember(this.communityId, member.userId).subscribe({
      next: () => {
        this.loadMembers();
        this.loadModLog();
        this.toastService.showSuccess('Member removed successfully');
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to remove member.';
        this.toastService.showError('Failed to remove member');
      }
    });
  }

  openBanModal(member: CommunityMemberResponse): void {
    this.banTarget = member;
    this.banReason = '';
    this.banDuration = '';
    this.showBanModal = true;
  }

  closeBanModal(): void {
    this.showBanModal = false;
    this.banTarget = null;
  }

  confirmBan(): void {
    if (!this.banTarget) return;
    this.banning = true;
    this.communityService.banMember(this.communityId, this.banTarget.userId, {
      reason: this.banReason || undefined,
      duration: this.banDuration || undefined
    }).subscribe({
      next: () => {
        this.banning = false;
        this.toastService.showSuccess('Member banned successfully');
        this.closeBanModal();
        this.loadMembers();
        this.loadBans();
        this.loadModLog();
      },
      error: (err) => {
        this.banning = false;
        this.error = err.error?.error || 'Failed to ban user.';
        this.toastService.showError('Failed to ban user');
      }
    });
  }

  unbanMember(userId: string): void {
    if (!confirm('Unban this user?')) return;
    this.communityService.unbanMember(this.communityId, userId).subscribe({
      next: () => {
        this.loadBans();
        this.loadModLog();
      },
      error: (err) => this.error = err.error?.error || 'Failed to unban user.'
    });
  }
}
