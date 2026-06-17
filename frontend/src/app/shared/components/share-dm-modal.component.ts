import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DmService, ConversationResponse } from '../../core/dm.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-share-dm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Share Post</h3>
          <button class="btn-close" (click)="onClose()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <button class="action-btn copy-btn" (click)="copyLink()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy Link</span>
          </button>

          <div class="divider-text">Or send to a chat</div>

          <div *ngIf="loading" class="loading-state">Loading chats...</div>
          <div *ngIf="!loading && conversations.length === 0" class="empty-state">No active chats found.</div>

          <div class="chats-list" *ngIf="!loading && conversations.length > 0">
            <div class="chat-row" *ngFor="let c of conversations">
              <div class="chat-info">
                <div class="chat-avatar">
                  {{ (c.otherParticipantDisplayName || c.otherParticipantUsername || '?').charAt(0).toUpperCase() }}
                </div>
                <div class="chat-name">{{ c.otherParticipantDisplayName || c.otherParticipantUsername }}</div>
              </div>
              <button 
                class="send-btn" 
                (click)="shareToConversation(c)" 
                [disabled]="sharingIds.has(c.id)"
              >
                {{ sharingIds.has(c.id) ? 'Sent' : 'Send' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 1rem;
    }
    .modal-content {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      max-height: 80vh;
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .btn-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-close:hover {
      background: var(--bg-hover);
      color: var(--text-main);
    }
    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      box-sizing: border-box;
      transition: all 0.15s;
    }
    .copy-btn {
      background: var(--text-main);
      color: var(--bg-main);
      border: 1px solid var(--text-main);
    }
    .copy-btn:hover {
      opacity: 0.9;
    }
    .divider-text {
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0.5rem 0;
    }
    .loading-state, .empty-state {
      text-align: center;
      color: var(--text-muted);
      padding: 1.5rem 0;
      font-size: 0.9rem;
    }
    .chats-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .chat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      border-radius: 8px;
      transition: background 0.1s;
    }
    .chat-row:hover {
      background: var(--bg-hover);
    }
    .chat-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }
    .chat-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--accent-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
      flex-shrink: 0;
    }
    .chat-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .send-btn {
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 700;
      background: var(--accent-color);
      color: white;
      border: none;
      cursor: pointer;
    }
    .send-btn:disabled {
      background: var(--border-color);
      color: var(--text-muted);
      cursor: not-allowed;
    }
  `]
})
export class ShareDmModalComponent implements OnInit {
  @Input() postId!: string;
  @Input() postTitle!: string;
  @Output() close = new EventEmitter<void>();

  conversations: ConversationResponse[] = [];
  loading = false;
  sharingIds = new Set<string>();

  constructor(
    private dmService: DmService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.dmService.getConversations().subscribe({
      next: (list) => {
        this.conversations = list;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onClose(): void {
    this.close.emit();
  }

  copyLink(): void {
    const url = `${window.location.origin}/posts/${this.postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.showSuccess('Link copied to clipboard');
      this.onClose();
    });
  }

  shareToConversation(c: ConversationResponse): void {
    const url = `${window.location.origin}/posts/${this.postId}`;
    const messageBody = `Check out this post: "${this.postTitle}"\n${url}`;
    this.sharingIds.add(c.id);
    
    this.dmService.sendMessage(c.id, messageBody).subscribe({
      next: () => {
        this.toastService.showSuccess(`Shared with ${c.otherParticipantDisplayName || c.otherParticipantUsername}`);
      },
      error: () => {
        this.sharingIds.delete(c.id);
        this.toastService.showError('Failed to send message');
      }
    });
  }
}
