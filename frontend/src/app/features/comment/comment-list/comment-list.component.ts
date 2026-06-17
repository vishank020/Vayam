import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../../core/auth.service';
import { CommentService, CommentResponse } from '../../../core/comment.service';
import { ToastService } from '../../../core/toast.service';
import { CommentComponent } from '../comment/comment.component';
import { UserService } from '../../../core/user.service';
import { GifPickerComponent } from '../gif-picker/gif-picker.component';
import { MarkdownEditorComponent } from '../../shared/markdown-editor/markdown-editor.component';
import { AnonymousBrowsingService } from '../../../core/anonymous-browsing.service';
import { CommentSkeletonComponent } from '../../../shared/components/comment-skeleton.component';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CommentComponent, GifPickerComponent, MarkdownEditorComponent, CommentSkeletonComponent],
  template: `
    <div class="comments-section">
      <h3>Comments</h3>

      <div class="comment-form" *ngIf="isLoggedIn; else loginPrompt">
        <div class="comment-editor-row">
          <div *ngIf="currentUser?.avatarUrl" class="img-wrapper" style="width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;">
            <div class="skeleton skeleton-overlay" *ngIf="!isImageLoaded(currentUser.avatarUrl)" style="border-radius: 50%;"></div>
            <img [src]="currentUser.avatarUrl" (load)="onImageLoaded(currentUser.avatarUrl)" class="comment-avatar" alt="Your avatar" />
          </div>
          <div *ngIf="!currentUser?.avatarUrl" class="comment-avatar comment-avatar--placeholder">{{ (currentUser?.displayName ?? currentUser?.username ?? '?')[0] }}</div>
          <div style="flex: 1;">
            <div class="textarea-container">
              <app-markdown-editor
                [(value)]="newComment"
                (valueChange)="onValueChange()"
                (editorKeydown)="onKeydown($event)"
                placeholder="Write a comment..."
                [rows]="3">
              </app-markdown-editor>

              <div class="mention-dropdown" *ngIf="showMentions">
                <div class="mention-item" *ngFor="let u of mentionResults; let i = index" 
                     [class.active]="i === mentionSelectedIndex"
                     (click)="selectMention(u.username)">
                  <div class="img-wrapper" style="width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;">
                    <div class="skeleton skeleton-overlay" *ngIf="u.avatarUrl && !isImageLoaded(u.avatarUrl)" style="border-radius: 50%;"></div>
                    <img [src]="u.avatarUrl || 'assets/default-avatar.png'" (load)="u.avatarUrl && onImageLoaded(u.avatarUrl)" alt="avatar" style="width: 24px; height: 24px; object-fit: cover; border-radius: 50%;" />
                  </div>
                  <span>{{ u.username }}</span>
                </div>
                <div class="mention-loading" *ngIf="mentionLoading">Searching...</div>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn-submit" [disabled]="!newComment.trim() || submitting" (click)="addComment()">
                {{ submitting ? 'Posting...' : 'Post Comment' }}
              </button>
              <button class="btn-gif" (click)="showGifPicker = !showGifPicker">GIF</button>
              
              <app-gif-picker 
                [visible]="showGifPicker" 
                (gifSelected)="onGifSelected($event)"
                (closed)="showGifPicker = false">
              </app-gif-picker>
            </div>
          </div>
        </div>
      </div>
      
      <ng-template #loginPrompt>
        <p class="login-prompt">
          <a routerLink="/login" [queryParams]="{ redirectUrl: currentUrl }">Log in</a>
          to join the conversation.
        </p>
      </ng-template>

      <app-comment-skeleton *ngIf="loading"></app-comment-skeleton>
      <div *ngIf="!loading && comments.length === 0" class="empty">
        No comments yet. Be the first to comment!
      </div>

      <div class="comment-list" *ngIf="!loading">
        <app-comment 
          *ngFor="let c of comments" 
          [comment]="c" 
          [depth]="0"
          [postId]="postId"
          [isLoggedIn]="isLoggedIn"
          [postAuthorId]="postAuthorId"
          (commentDeleted)="onCommentDeleted($event)"
          (replyAdded)="onRootReplyAdded(c, $event)">
        </app-comment>
      </div>
    </div>
  `,
  styles: [`
    .comments-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
    h3 { margin: 0 0 1rem; font-size: 1.1rem; color: var(--text-main); font-weight: 600; }
    
    .comment-form { margin-bottom: 1.25rem; position: relative; }
    .textarea-container { position: relative; }
    
    .mention-dropdown { position: absolute; bottom: 100%; left: 0; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 250px; max-height: 200px; overflow-y: auto; z-index: 1000; margin-bottom: 4px; }
    .mention-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid var(--border-color); }
    .mention-item:last-child { border-bottom: none; }
    .mention-item:hover, .mention-item.active { background: var(--bg-hover); }
    .mention-item img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
    .mention-item span { font-size: 0.85rem; color: var(--text-main); font-weight: 500; }
    .mention-loading { padding: 0.5rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; }
    
    .form-actions { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; position: relative; }
    .btn-submit { padding: 0.5rem 1rem; background: var(--accent-color); color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s ease; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-submit:hover:not(:disabled) { background: #3a5ce5; }
    .btn-gif { background: transparent; border: 1px dashed var(--border-color); color: var(--text-main); border-radius: 6px; cursor: pointer; padding: 0.4rem 0.8rem; font-size: 0.85rem; font-weight: 600; }
    .btn-gif:hover { background: var(--bg-hover); border-color: var(--text-muted); }
    
    .loading, .empty { color: var(--text-muted); font-size: 0.9rem; padding: 0.5rem 0; text-align: center; }
    .comment-list { display: flex; flex-direction: column; }
    
    .login-prompt { color: var(--text-muted); font-size: 0.9rem; padding: 0.5rem 0; }
    .login-prompt a { color: var(--accent-color); font-weight: 500; text-decoration: none; }
    .login-prompt a:hover { text-decoration: underline; }
    .comment-editor-row { display: flex; gap: 10px; align-items: flex-start; }
    .comment-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 6px; }
    .comment-avatar--placeholder { background: var(--bg-elevated, #e5e7eb); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--text-muted); }
  `]
})
export class CommentListComponent implements OnInit, OnDestroy {
  @Input() postId!: string;
  @Input() postAuthorId?: string | null = null;
  @Output() totalCount = new EventEmitter<number>();
  comments: CommentResponse[] = [];
  
  newComment = '';
  submitting = false;
  loading = false;
  isLoggedIn = false;
  currentUser: any = null;
  currentUrl = '';
  loadedImages = new Set<string>();

  onImageLoaded(url: string): void {
    this.loadedImages.add(url);
  }

  isImageLoaded(url: string): boolean {
    return this.loadedImages.has(url);
  }

  @ViewChild(MarkdownEditorComponent) markdownEditor!: MarkdownEditorComponent;
  showGifPicker = false;
  
  showMentions = false;
  mentionResults: any[] = [];
  mentionLoading = false;
  mentionSelectedIndex = 0;
  mentionSearchTerm = '';
  mentionStartIndex = -1;
  private mentionSearch$ = new Subject<string>();
  private mentionSub?: Subscription;

  constructor(
    private commentService: CommentService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private toastService: ToastService,
    private anonymousBrowsingService: AnonymousBrowsingService
  ) {
    this.mentionSub = this.mentionSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => query.length > 0
        ? this.userService.searchUsers(query)
        : of([])
      )
    ).subscribe(users => {
      this.mentionResults = users;
      this.mentionSelectedIndex = 0;
      this.mentionLoading = false;
    });
  }

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.authService.checkAuth().subscribe(u => {
      this.currentUser = u;
      this.isLoggedIn = u !== null;
    });
    this.loadComments();
  }

  ngOnDestroy(): void {
    this.mentionSub?.unsubscribe();
  }

  loadComments(): void {
    this.loading = true;
    this.commentService.getComments(this.postId).subscribe({
      next: (res) => {
        this.comments = res || [];
        this.totalCount.emit(this.comments.length);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  addComment(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.newComment.trim()) return;
    this.submitting = true;
    this.commentService.createComment(this.postId, this.newComment).subscribe({
      next: (comment) => {
        comment.replies = [];
        this.comments = [comment, ...this.comments];
        this.newComment = '';
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
        this.toastService.showError('Could not post comment. Please try again.');
      }
    });
  }

  onValueChange(): void {
    const val = this.newComment;
    const cursorPos = this.markdownEditor?.cursorPos ?? val.length;
    
    const textBeforeCursor = val.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\\w*)$/);
    
    if (mentionMatch) {
      this.showMentions = true;
      this.mentionSearchTerm = mentionMatch[1];
      this.mentionStartIndex = mentionMatch.index!;
      this.mentionSearch$.next(this.mentionSearchTerm);
    } else {
      this.closeMentions();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.showMentions && this.mentionResults.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.mentionSelectedIndex = (this.mentionSelectedIndex + 1) % this.mentionResults.length;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.mentionSelectedIndex = (this.mentionSelectedIndex - 1 + this.mentionResults.length) % this.mentionResults.length;
      } else if (event.key === 'Enter' && this.showMentions) {
        event.preventDefault();
        this.selectMention(this.mentionResults[this.mentionSelectedIndex].username);
      } else if (event.key === 'Escape') {
        this.closeMentions();
      }
    }
  }

  selectMention(username: string): void {
    if (!this.markdownEditor) return;
    const cursorPos = this.markdownEditor.cursorPos;
    const before = this.newComment.substring(0, this.mentionStartIndex);
    const after = this.newComment.substring(cursorPos);
    this.newComment = `${before}@${username} ${after}`;
    this.closeMentions();
    this.markdownEditor.focus();
  }

  closeMentions(): void {
    this.showMentions = false;
    this.mentionResults = [];
    this.mentionStartIndex = -1;
  }

  onGifSelected(url: string): void {
    const markdown = `![gif](${url})`;
    if (this.markdownEditor) {
      this.markdownEditor.insertAtCursorPos(markdown);
    } else {
      this.newComment += markdown;
    }
  }

  onCommentDeleted(comment: CommentResponse): void {
    const idx = this.comments.indexOf(comment);
    if (idx > -1) {
      this.comments.splice(idx, 1);
      this.toastService.showUndo('Comment deleted', () => {
        this.comments.splice(idx, 0, comment);
      }, () => {
        this.commentService.deleteComment(this.postId, comment.id).subscribe();
      });
    }
  }

  onRootReplyAdded(root: CommentResponse, reply: CommentResponse): void {
    if (!root.replies) root.replies = [];
    root.replies.push(reply);
  }
}
