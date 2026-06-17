import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PostService, CreatePostRequest, FeedPostResponse } from '../../../../core/post.service';
import { CommunityService, CommunityResponse, CommunityTagResponse } from '../../../../core/community.service';
import { AuthService } from '../../../../core/auth.service';
import { MarkdownEditorComponent } from '../../../shared/markdown-editor/markdown-editor.component';
import { environment } from '../../../../../environments/environment';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
const MAX_FILES = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MarkdownEditorComponent],
  template: `
    <div class="create-post-page">
      <a routerLink="/feed" class="back-link">&larr; Back to Feed</a>

      <div *ngIf="!authenticated" class="login-prompt">
        You must <a routerLink="/login">sign in</a> to create a post.
      </div>

      <div class="form-card" *ngIf="authenticated">
        <h1>Create Post</h1>
        <form (ngSubmit)="submit()" #postForm="ngForm">
          <div class="form-group">
            <label for="title">Title</label>
            <input
              id="title"
              name="title"
              [(ngModel)]="request.title"
              required
              #title="ngModel"
              placeholder="Post title"
            />
            <div class="error-hint" *ngIf="title.invalid && title.touched">Title is required</div>
          </div>

          <div class="form-group">
            <label for="content">Content</label>
            <app-markdown-editor [(value)]="request.content" [rows]="6" placeholder="What's on your mind?"></app-markdown-editor>
          </div>

          <div class="form-group">
            <label>Media</label>
            <div class="media-upload-area">
              <input
                #fileInput
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                multiple
                (change)="onFileSelect($event)"
                hidden
              />
              <button type="button" class="btn-add-media" (click)="fileInput.click()" [disabled]="selectedFiles.length >= MAX_FILES">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m3 16 5-5 3 3 4-4 6 6"/></svg>
                Add Image/Video
              </button>
              <span class="media-hint">{{ selectedFiles.length }}/{{ MAX_FILES }} files</span>
            </div>
            <div class="media-previews" *ngIf="selectedFiles.length > 0">
              <div class="media-preview-item" *ngFor="let file of selectedFiles; let i = index">
                <img *ngIf="file.type.startsWith('image/')" [src]="file.objectUrl" class="preview-thumb" alt="preview" />
                <div *ngIf="file.type.startsWith('video/')" class="preview-video-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {{ file.name }}
                </div>
                <button type="button" class="btn-remove-media" (click)="removeFile(i)">&times;</button>
              </div>
            </div>
            <div class="media-error" *ngIf="mediaError">{{ mediaError }}</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="postType">Type</label>
              <select id="postType" name="postType" [(ngModel)]="request.postType">
                <option value="GENERAL">General</option>
                <option value="ACHIEVEMENT">Achievement</option>
                <option value="PROJECT">Project</option>
                <option value="JOB">Job</option>
              </select>
            </div>

            <div class="form-group" *ngIf="!isCommunityLocked">
              <label for="community">Community (optional)</label>
              <select id="community" name="community" [(ngModel)]="request.communityId" (ngModelChange)="onCommunityChange($event)">
                <option [ngValue]="null">None — global post</option>
                <option *ngFor="let c of communities" [ngValue]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group locked-community" *ngIf="isCommunityLocked && lockedCommunity">
              <label>Posting in Community</label>
              <div class="locked-community-display">
                <span class="community-name">{{ lockedCommunity.name }}</span>
                <span class="community-slug">c/{{ lockedCommunity.slug }}</span>
              </div>
            </div>

            <div class="form-group" *ngIf="request.communityId && tags.length > 0">
              <label for="tag">Tag (optional)</label>
              <select id="tag" name="tag" [(ngModel)]="request.tagId">
                <option [ngValue]="null">None</option>
                <option *ngFor="let t of tags" [ngValue]="t.id" [style.color]="t.color">
                  {{ t.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" name="isAnonymous" [(ngModel)]="request.isAnonymous" />
              <span>Post anonymously</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="scheduleEnabled" name="scheduleEnabled" />
              <span>Schedule for later</span>
            </label>
            <input *ngIf="scheduleEnabled" type="datetime-local" [(ngModel)]="scheduleDate" name="scheduleDate" class="form-input" style="margin-top:0.4rem" />
          </div>

          <div class="form-actions">
            <button type="button" class="btn-draft" (click)="saveDraft()" [disabled]="submitting">
              {{ submitting ? 'Saving...' : 'Save Draft' }}
            </button>
            <button type="submit" class="btn-submit" [disabled]="postForm.invalid || submitting">
              <span class="spinner" *ngIf="submitting"></span>
              {{ submitting ? 'Posting...' : 'Publish Post' }}
            </button>
          </div>
          <div class="drafts-section" *ngIf="drafts.length > 0">
            <h3>Your Drafts</h3>
            <div class="draft-item" *ngFor="let draft of drafts" (click)="loadDraft(draft)">
              <span class="draft-title">{{ draft.title || 'Untitled' }}</span>
              <span class="draft-date">{{ draft.updatedAt | date:'short' }}</span>
            </div>
          </div>
          <div class="error-message" *ngIf="error">{{ error }}</div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .create-post-page {
      max-width: 640px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }
    .back-link {
      color: var(--accent-color);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      display: inline-block;
      margin-bottom: 1rem;
    }
    .back-link:hover { text-decoration: underline; }
    .login-prompt {
      text-align: center;
      padding: 3rem 0;
      color: var(--text-muted);
      font-size: 1rem;
    }
    .login-prompt a { color: var(--accent-color); }
    .form-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
    }
    .form-card h1 {
      margin: 0 0 1.25rem;
      font-size: 1.3rem;
      color: var(--text-main);
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.3rem;
    }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: inherit;
      box-sizing: border-box;
      background: var(--bg-main);
      color: var(--text-main);
    }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .form-row .form-group {
      flex: 1;
    }
    .checkbox-group {
      margin-top: 0.5rem;
    }
    .checkbox-label {
      display: flex !important;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: 400 !important;
    }
    .checkbox-label input {
      width: auto;
    }
    .error-hint {
      color: var(--danger);
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    .media-upload-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-add-media {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--bg-hover);
      border: 1px dashed var(--border-color);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      cursor: pointer;
      color: var(--text-muted);
    }
    .btn-add-media:hover:not(:disabled) {
      border-color: var(--accent-color);
      color: var(--accent-color);
    }
    .btn-add-media:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .media-hint {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .media-previews {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .media-preview-item {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      background: var(--bg-hover);
    }
    .preview-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .preview-video-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 0.7rem;
      color: var(--text-muted);
      text-align: center;
      padding: 0.25rem;
      word-break: break-all;
    }
    .btn-remove-media {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: none;
      background: rgba(0,0,0,0.5);
      color: white;
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-remove-media:hover {
      background: rgba(231,76,60,0.8);
    }
    .media-error {
      color: var(--danger);
      font-size: 0.8rem;
      margin-top: 0.35rem;
    }
    .btn-submit {
      background: var(--accent-color);
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-submit:hover:not(:disabled) {
      background: var(--accent-hover);
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .form-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .btn-draft {
      padding: 0.6rem 1.25rem;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 8px;
      background: transparent;
      color: var(--text-secondary, #666);
      cursor: pointer;
      font-size: 0.95rem;
    }
    .btn-draft:hover { background: var(--hover-bg, #f5f5f5); }
    .drafts-section {
      margin-top: 1.5rem;
      border-top: 1px solid var(--border-color, #eee);
      padding-top: 1rem;
    }
    .drafts-section h3 { font-size: 1rem; margin-bottom: 0.5rem; }
    .draft-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .draft-item:hover { background: var(--hover-bg, #f5f5f5); }
    .draft-title { font-weight: 500; }
    .draft-date { color: var(--text-secondary, #888); font-size: 0.8rem; }
    .error-message {
      color: var(--danger);
      margin-top: 0.75rem;
      font-size: 0.9rem;
    }
    .locked-community-display {
      background: var(--bg-hover);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.6rem 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95rem;
      font-weight: 500;
    }
    .community-name { color: var(--text-main); }
    .community-slug { color: var(--text-muted); font-size: 0.85rem; }

    @media (max-width: 767px) {
      .create-post-page { padding: 1rem 0.75rem; }
      .form-card { padding: 1rem; }
      .form-row { flex-direction: column; gap: 0; }
      .media-previews { flex-direction: column; }
      .media-preview-item { width: 100%; height: auto; aspect-ratio: 16/9; }
    }
  `]
})
export class CreatePostComponent implements OnInit, OnDestroy {
  readonly MAX_FILES = MAX_FILES;

  request: CreatePostRequest = {
    title: '',
    content: '',
    postType: 'GENERAL',
    communityId: null,
    isAnonymous: false,
    mediaUrls: []
  };

  selectedFiles: { file: File; objectUrl: string; name: string; type: string }[] = [];
  uploadedUrls: string[] = [];
  communities: CommunityResponse[] = [];
  authenticated = false;
  submitting = false;
  error = '';
  mediaError = '';
  scheduleEnabled = false;
  scheduleDate = '';
  drafts: FeedPostResponse[] = [];
  isCommunityLocked = false;
  lockedCommunity: CommunityResponse | null = null;
  tags: CommunityTagResponse[] = [];

  constructor(
    private postService: PostService,
    private communityService: CommunityService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.authService.checkAuth().subscribe(u => {
      this.authenticated = u !== null;
      if (u) this.loadDrafts();
    });

    this.route.queryParams.subscribe(params => {
      const communityIdParam = params['communityId'];
      if (communityIdParam) {
        this.isCommunityLocked = true;
        this.request.communityId = communityIdParam;
        this.loadLockedCommunity(communityIdParam);
      }
    });

    this.communityService.listPublic(0, 100).subscribe({
      next: (res) => this.communities = res.content || res,
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    this.selectedFiles.forEach(f => URL.revokeObjectURL(f.objectUrl));
  }

  loadDrafts(): void {
    this.postService.getDrafts(0, 10).subscribe({
      next: (res) => this.drafts = res.content || [],
      error: () => {}
    });
  }

  saveDraft(): void {
    if (!this.request.title.trim()) return;
    this.submitting = true;
    this.error = '';
    this.request.saveAsDraft = true;
    this.postService.createPost(this.request).subscribe({
      next: () => {
        this.submitting = false;
        this.request.saveAsDraft = false;
        this.loadDrafts();
      },
      error: () => {
        this.error = 'Failed to save draft.';
        this.submitting = false;
        this.request.saveAsDraft = false;
      }
    });
  }

  loadDraft(draft: FeedPostResponse): void {
    this.request.title = draft.title;
    this.request.content = draft.content;
    this.request.postType = draft.postType;
    this.request.communityId = draft.communityId;
  }

  onFileSelect(event: Event): void {
    this.mediaError = '';
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const newFiles = Array.from(input.files);
    const total = this.selectedFiles.length + newFiles.length;

    if (total > MAX_FILES) {
      this.mediaError = `Maximum ${MAX_FILES} files allowed.`;
      input.value = '';
      return;
    }

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.mediaError = `"${file.name}" has an unsupported file type.`;
        input.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        this.mediaError = `"${file.name}" exceeds the 10MB limit.`;
        input.value = '';
        return;
      }
      this.selectedFiles.push({
        file,
        objectUrl: URL.createObjectURL(file),
        name: file.name,
        type: file.type
      });
    }

    input.value = '';
  }

  removeFile(index: number): void {
    URL.revokeObjectURL(this.selectedFiles[index].objectUrl);
    this.selectedFiles.splice(index, 1);
  }

  async submit(): Promise<void> {
    if (!this.request.title.trim() || !this.request.content.trim()) return;
    this.submitting = true;
    this.error = '';
    this.mediaError = '';

    try {
      this.uploadedUrls = [];

      for (const item of this.selectedFiles) {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('prefix', 'posts');

        const res = await this.http.post<{ objectName: string; url: string }>(
          `${environment.apiUrl}/storage/upload`, formData
        ).toPromise();

        if (res) {
          this.uploadedUrls.push(res.url);
        }
      }

      this.request.mediaUrls = this.uploadedUrls;

      if (this.scheduleEnabled && this.scheduleDate) {
        this.request.scheduledAt = new Date(this.scheduleDate).toISOString();
      }

      this.postService.createPost(this.request).subscribe({
        next: (post) => {
          this.selectedFiles.forEach(f => URL.revokeObjectURL(f.objectUrl));
          this.selectedFiles = [];
          this.router.navigate(['/posts', post.id]);
        },
        error: () => {
          this.error = 'Failed to create post.';
          this.submitting = false;
        }
      });
    } catch {
      this.error = 'Failed to upload media.';
      this.submitting = false;
    }
  }

  loadLockedCommunity(id: string): void {
    this.communityService.getById(id).subscribe({
      next: (community) => {
        this.lockedCommunity = community;
        this.onCommunityChange(id);
      },
      error: () => {
        this.error = 'Failed to load community details.';
      }
    });
  }

  onCommunityChange(communityId: string | null): void {
    this.request.tagId = null;
    this.tags = [];
    if (communityId) {
      this.communityService.getTags(communityId).subscribe({
        next: (tags) => {
          this.tags = tags;
        },
        error: () => {}
      });
    }
  }
}
