import { Component, EventEmitter, Input, Output, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommentService, CommentResponse } from '../../../core/comment.service';
import { UserService } from '../../../core/user.service';
import { GifPickerComponent } from '../gif-picker/gif-picker.component';
import { MarkdownEditorComponent } from '../../shared/markdown-editor/markdown-editor.component';
import { ToastService } from '../../../core/toast.service';
import { marked } from 'marked';
import { timeAgo } from '../../../core/time-ago';
import { CommentActionsMenuComponent } from '../components/comment-actions-menu/comment-actions-menu.component';
import { AnonymousBrowsingService } from '../../../core/anonymous-browsing.service';

@Component({
  selector: 'app-comment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GifPickerComponent, MarkdownEditorComponent, CommentActionsMenuComponent],
  template: `
    <div class="comment-item" [class.comment-depth-0]="depth === 0" [class.comment-depth-1]="depth > 0">
      <div class="comment-header">
        <a *ngIf="!comment.isAnonymous" [routerLink]="['/u', comment.authorUsername]" class="comment-avatar-link">
          <img *ngIf="comment.authorAvatarUrl" [src]="comment.authorAvatarUrl" alt="{{comment.authorUsername}} profile picture" class="avatar-img">
          <span *ngIf="!comment.authorAvatarUrl" class="avatar-initials">{{ (comment.authorDisplayName || comment.authorUsername || '?')[0] }}</span>
        </a>
        <span *ngIf="comment.isAnonymous" class="avatar-initials avatar-anon">A</span>

        <a *ngIf="!comment.isAnonymous" [routerLink]="['/u', comment.authorUsername]" class="comment-author-name">
          <strong>{{ comment.authorDisplayName || comment.authorUsername }}</strong>
        </a>
        <strong *ngIf="comment.isAnonymous" class="comment-author-name">Anonymous</strong>

        <span class="comment-time"> • {{ commentTime }}</span>
        <span *ngIf="comment.updatedAt !== comment.createdAt" style="color: var(--text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Edited</span>
        
        <div style="margin-left: auto;">
          <app-comment-actions-menu
            [postId]="postId"
            [commentId]="comment.id"
            [authorId]="comment.authorId"
            [authorUsername]="comment.authorUsername"
            (deleteRequested)="onDeleteRequested()"
            (editRequested)="startEditing()">
          </app-comment-actions-menu>
        </div>
      </div>
      
      <div class="comment-body" *ngIf="!editing" [innerHTML]="parsedContent"></div>

      <div class="edit-form" *ngIf="editing">
        <app-markdown-editor
          [(value)]="editContent"
          placeholder="Edit your comment..."
          [rows]="3">
        </app-markdown-editor>
        <div class="edit-actions">
          <button class="btn-cancel btn-sm" (click)="cancelEditing()">Cancel</button>
          <button class="btn-submit btn-sm" [disabled]="!editContent.trim() || submitting" (click)="submitEdit()">Save</button>
        </div>
      </div>
      
      <div class="comment-actions">
        <button class="btn-vote" [class.active-like]="comment.userVote === 1" (click)="vote(1)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
          {{ comment.upvoteCount || 0 }}
        </button>
        <button class="btn-vote" [class.active-dislike]="comment.userVote === -1" (click)="vote(-1)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
          {{ comment.downvoteCount || 0 }}
        </button>
        <button class="btn-reply" *ngIf="isLoggedIn" (click)="toggleReply()">Reply</button>
      </div>

      <div class="reply-form" *ngIf="replying">
        <div class="textarea-container">
          <app-markdown-editor
            [(value)]="replyContent"
            (valueChange)="onValueChange()"
            (editorKeydown)="onKeydown($event)"
            placeholder="Write a reply..."
            [rows]="2">
          </app-markdown-editor>

          <div class="mention-dropdown" *ngIf="showMentions">
            <div class="mention-item" *ngFor="let u of mentionResults; let i = index" 
                 [class.active]="i === mentionSelectedIndex"
                 (click)="selectMention(u.username)">
              <img *ngIf="u.avatarUrl" [src]="u.avatarUrl" alt="avatar" class="mention-avatar" />
              <span *ngIf="!u.avatarUrl" class="mention-avatar avatar-initials">{{ u.username[0] | uppercase }}</span>
              <span>{{ u.username }}</span>
            </div>
            <div class="mention-loading" *ngIf="mentionLoading">Searching...</div>
          </div>
        </div>
        
        <div class="reply-actions">
          <button class="btn-submit btn-sm" [disabled]="!replyContent.trim() || submitting" (click)="submitReply()">Post Reply</button>
          <div class="action-right">
            <button class="btn-gif" (click)="showGifPicker = !showGifPicker">GIF</button>
            <button class="btn-cancel btn-sm" (click)="replying = false; replyContent = ''">Cancel</button>
          </div>
          
          <app-gif-picker 
            [visible]="showGifPicker" 
            (gifSelected)="onGifSelected($event)"
            (closed)="showGifPicker = false">
          </app-gif-picker>
        </div>
      </div>
      
      <div class="replies" *ngIf="depth === 0 && comment.replies?.length">
        <app-comment 
          *ngFor="let reply of comment.replies"
          [comment]="reply"
          [depth]="1"
          [postId]="postId"
          [isLoggedIn]="isLoggedIn"
          (commentDeleted)="onChildDeleted($event)"
          (replyAdded)="onChildReplyAdded($event)">
        </app-comment>
      </div>
    </div>
  `,
  styles: [`
    .comment-item { }
    
    .comment-depth-0 {
      padding: 1.5rem 0;
      border-top: 1px solid var(--border-color);
    }
    .comment-depth-0:first-child {
      border-top: none;
    }
    
    .comment-depth-1 {
      position: relative;
      margin-left: 2rem;
      padding-left: 1.5rem;
      padding-top: 1rem;
      padding-bottom: 0;
    }
    .comment-depth-1::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--border-color);
    }
    
    .comment-header { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; }
    
    .comment-avatar-link { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; transition: opacity 0.2s; flex-shrink: 0; }
    .comment-avatar-link:hover { opacity: 0.8; }
    .avatar-img, .avatar-initials { border-radius: 50%; object-fit: cover; }
    
    .comment-depth-0 .avatar-img, .comment-depth-0 .avatar-initials { width: 36px; height: 36px; font-size: 1rem; }
    .comment-depth-1 .avatar-img, .comment-depth-1 .avatar-initials { width: 32px; height: 32px; font-size: 0.9rem; }

    .avatar-initials { background: var(--text-main); color: var(--bg-main); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; text-transform: uppercase; }
    .avatar-anon { background: var(--border-color); color: var(--text-muted); }
    
    .comment-author-name { color: var(--text-main); text-decoration: none; }
    .comment-author-name:hover { text-decoration: underline; }
    .comment-author-name strong { font-weight: 700; font-size: 0.95rem; }
    .comment-depth-1 .comment-author-name strong { font-weight: 600; font-size: 0.9rem; }
    
    .comment-time { color: var(--text-muted); font-size: 0.8rem; font-family: monospace; letter-spacing: 0.05em; }
    
    .comment-body { margin: 0 0 1rem 0; color: var(--text-main); font-size: 1rem; line-height: 1.6; word-break: break-word; font-weight: 400; padding-left: 0.5rem; }
    .comment-body p { margin: 0 0 0.5rem; }
    .comment-body p:last-child { margin-bottom: 0; }
    .comment-body img { max-width: 100%; max-height: 400px; border: 1px solid var(--border-color); display: block; margin: 0.5rem 0; }
    .comment-body code { background: var(--bg-hover); padding: 0.1rem 0.35rem; font-size: 0.9em; font-family: monospace; border: 1px solid var(--border-color); }
    .comment-body a { color: var(--accent-color); text-decoration: underline; }
    
    .btn-delete:hover { opacity: 0.7; }
    
    .edit-form { margin-bottom: 1rem; padding-left: 0.5rem; }
    .edit-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
    
    .comment-actions { display: flex; align-items: center; gap: 1rem; }
    .btn-vote { display: inline-flex; align-items: center; gap: 0.4rem; background: transparent; border: none; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; padding: 0; cursor: pointer; transition: color 0.1s ease; }
    .btn-vote:hover { color: var(--text-main); }
    .btn-vote.active-like { color: var(--success); }
    .btn-vote.active-dislike { color: var(--danger); }
    .btn-reply { background: transparent; border: none; color: var(--text-main); font-size: 0.85rem; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; padding: 0; }
    .btn-reply:hover { opacity: 0.7; }
    
    .reply-form { margin-top: 1rem; position: relative; border-left: 1px solid var(--text-main); padding-left: 1rem; margin-left: 0.5rem; }
    .textarea-container { position: relative; margin-bottom: 0.5rem; }
    
    .mention-dropdown { position: absolute; bottom: 100%; left: 0; background: var(--bg-main); border: 1px solid var(--border-color); width: 250px; max-height: 200px; overflow-y: auto; z-index: 1000; margin-bottom: 4px; }
    .mention-item { padding: 0.5rem 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main); font-weight: 500; font-size: 0.9rem; }
    .mention-item:hover, .mention-item.active { background: var(--border-color); }
    .mention-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
    .mention-loading { padding: 0.5rem 1rem; color: var(--text-muted); font-style: italic; font-size: 0.9rem; }
    
    .reply-actions { display: flex; justify-content: space-between; align-items: center; }
    .action-right { display: flex; align-items: center; gap: 1rem; }
    .btn-submit { padding: 0.4rem 1rem; background: var(--text-main); color: var(--bg-main); border: none; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: opacity 0.2s ease; }
    .btn-submit:disabled { opacity: 0.3; }
    .btn-submit:hover:not(:disabled) { opacity: 0.8; }
    .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.8rem; }
    .btn-cancel { background: transparent; border: none; color: var(--text-muted); font-weight: 600; text-transform: uppercase; cursor: pointer; }

    @media (max-width: 767px) {
      .comment-depth-1 { margin-left: 0.75rem; padding-left: 0.75rem; }
      .comment-depth-0 .avatar-img, .comment-depth-0 .avatar-initials { width: 28px; height: 28px; font-size: 0.8rem; }
      .comment-depth-1 .avatar-img, .comment-depth-1 .avatar-initials { width: 24px; height: 24px; font-size: 0.75rem; }
      .comment-author-name strong { font-size: 0.85rem; }
      .comment-time { font-size: 0.7rem; }
      .comment-body { font-size: 0.9rem; padding-left: 0; }
      .comment-actions { gap: 0.6rem; }
      .btn-vote { font-size: 0.8rem; }
      .btn-reply { font-size: 0.8rem; }
      .reply-form { margin-left: 0; padding-left: 0.75rem; }
      .mention-dropdown { width: 220px; }
    }
    .btn-cancel:hover { color: var(--text-main); }
    .btn-gif { background: transparent; border: 1px solid var(--text-main); color: var(--text-main); cursor: pointer; padding: 0.3rem 0.6rem; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
    .btn-gif:hover { background: var(--text-main); color: var(--bg-main); }
    
    .replies { display: flex; flex-direction: column; margin-top: 1rem; }
  `]
})
export class CommentComponent implements OnDestroy {
  @Input() comment!: CommentResponse;
  @Input() depth: number = 0;
  @Input() postId!: string;
  @Input() isLoggedIn: boolean = false;
  
  @Output() commentDeleted = new EventEmitter<CommentResponse>();
  @Output() replyAdded = new EventEmitter<CommentResponse>();
  
  @ViewChild(MarkdownEditorComponent) markdownEditor!: MarkdownEditorComponent;

  replying = false;
  replyContent = '';
  submitting = false;
  
  editing = false;
  editContent = '';
  
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
    private userService: UserService,
    private toastService: ToastService,
    private anonymousBrowsingService: AnonymousBrowsingService,
    private router: Router
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

  ngOnDestroy(): void {
    this.mentionSub?.unsubscribe();
  }

  get parsedContent(): string {
    return marked.parse(this.comment?.content || '', { breaks: true }) as string;
  }

  get commentTime(): string {
    return timeAgo(this.comment?.createdAt || '');
  }

  toggleReply(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    this.replying = !this.replying;
    if (this.replying) {
      this.replyContent = `@${this.comment.authorUsername} `;
      setTimeout(() => {
        if (this.markdownEditor) this.markdownEditor.focus();
      }, 0);
    }
  }

  onValueChange(): void {
    const val = this.replyContent;
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
    const before = this.replyContent.substring(0, this.mentionStartIndex);
    const after = this.replyContent.substring(cursorPos);
    this.replyContent = `${before}@${username} ${after}`;
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
      this.replyContent += markdown;
    }
  }

  submitReply(): void {
    if (!this.replyContent.trim()) return;
    this.submitting = true;
    
    // Flatten parentId if depth > 0 to enforce 2-level max nesting
    const targetParentId = this.depth === 0 ? this.comment.id : (this.comment.parentId || this.comment.id);
    
    this.commentService.createComment(this.postId, this.replyContent, targetParentId).subscribe({
      next: (res) => {
        this.replyAdded.emit(res);
        this.replying = false;
        this.replyContent = '';
        this.submitting = false;
      },
      error: () => this.submitting = false
    });
  }

  onDeleteRequested(): void {
    this.commentDeleted.emit(this.comment);
  }

  startEditing(): void {
    this.editing = true;
    this.editContent = this.comment.content;
  }

  cancelEditing(): void {
    this.editing = false;
    this.editContent = '';
  }

  submitEdit(): void {
    if (!this.editContent.trim()) return;
    this.submitting = true;

    this.commentService.updateComment(this.postId, this.comment.id, this.editContent).subscribe({
      next: (res) => {
        this.comment.content = res.content;
        this.comment.updatedAt = res.updatedAt;
        this.editing = false;
        this.submitting = false;
      },
      error: () => this.submitting = false
    });
  }

  vote(direction: number): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    
    const newDirection = this.comment.userVote === direction ? 0 : direction;
    const previousVote = this.comment.userVote || 0;
    const previousUpvoteCount = this.comment.upvoteCount ?? 0;
    const previousDownvoteCount = this.comment.downvoteCount ?? 0;

    if (previousVote === 1) this.comment.upvoteCount = Math.max(0, (this.comment.upvoteCount || 0) - 1);
    if (previousVote === -1) this.comment.downvoteCount = Math.max(0, (this.comment.downvoteCount || 0) - 1);

    if (newDirection === 1) this.comment.upvoteCount = (this.comment.upvoteCount || 0) + 1;
    if (newDirection === -1) this.comment.downvoteCount = (this.comment.downvoteCount || 0) + 1;

    this.comment.userVote = newDirection;

    this.commentService.voteComment(this.postId, this.comment.id, newDirection).subscribe({
      error: () => {
        this.comment!.userVote = previousVote;
        this.comment!.upvoteCount = previousUpvoteCount;
        this.comment!.downvoteCount = previousDownvoteCount;
      }
    });
  }

  onChildDeleted(child: CommentResponse): void {
    if (this.comment.replies) {
      const idx = this.comment.replies.indexOf(child);
      if (idx > -1) {
        this.comment.replies.splice(idx, 1);
        this.toastService.showUndo('Reply deleted', () => {
          this.comment.replies!.splice(idx, 0, child);
        }, () => {
          this.commentService.deleteComment(this.postId, child.id).subscribe();
        });
      }
    }
  }

  onChildReplyAdded(reply: CommentResponse): void {
    // If a child emits a reply, it actually targets this root component as the parent (flattened)
    this.replyAdded.emit(reply);
  }
}
