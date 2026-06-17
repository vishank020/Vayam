import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DmService, ConversationResponse } from '../../../../core/dm.service';
import { UserService } from '../../../../core/user.service';
import { AuthService } from '../../../../core/auth.service';
import { CommentSkeletonComponent } from '../../../../shared/components/comment-skeleton.component';

@Component({
  selector: 'app-dm-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CommentSkeletonComponent],
  template: `
    <div class="dm-page">
      <div class="dm-header">
        <h1>Messages</h1>
      </div>

      <div class="new-conversation">
        <input
          [(ngModel)]="searchUsername"
          placeholder="Search user by username..."
          (keyup.enter)="startConversation()"
        />
        <button (click)="startConversation()" [disabled]="!searchUsername.trim()">Chat</button>
      </div>

      <app-comment-skeleton *ngIf="loading" [count]="5"></app-comment-skeleton>
      <div *ngIf="!loading && conversations.length === 0" class="empty">
        No conversations yet. Search for a user to start chatting.
      </div>

      <div class="conversation-list" *ngIf="!loading">
        <a
          *ngFor="let c of conversations"
          [routerLink]="['/dm', c.id]"
          class="conversation-card"
        >
          <div class="conversation-avatar">
            {{ (c.otherParticipantDisplayName || c.otherParticipantUsername || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="conversation-info">
            <div class="conversation-name-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div class="conversation-name">
                {{ c.otherParticipantDisplayName || c.otherParticipantUsername }}
              </div>
              <span class="unread-badge" *ngIf="c.unreadCount > 0">{{ c.unreadCount }}</span>
            </div>
            <div class="conversation-preview" *ngIf="c.lastMessage">
              {{ c.lastMessage }}
            </div>
            <div class="conversation-time" *ngIf="c.lastMessageAt">
              {{ c.lastMessageAt | date:'MMM d, h:mm a' }}
            </div>
          </div>
        </a>
      </div>
      <button class="fab" (click)="startConversation()" title="New conversation">+</button>
    </div>
  `,
  styles: [`
    .dm-page {
      max-width: 640px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }
    .dm-header h1 {
      margin: 0 0 1rem;
      font-size: 1.4rem;
      color: var(--text-main);
    }
    .new-conversation {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .new-conversation input {
      flex: 1;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.9rem;
    }
    .new-conversation input:focus {
      outline: none;
      border-color: var(--accent-color);
    }
    .new-conversation button {
      padding: 0.6rem 1rem;
      background: var(--accent-color);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .new-conversation button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .loading, .empty {
      text-align: center;
      color: var(--text-muted);
      padding: 2rem 0;
    }
    .conversation-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .conversation-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      text-decoration: none;
      color: inherit;
      transition: background 0.1s;
    }
    .conversation-card:hover {
      background: var(--bg-elevated);
    }

    .fab { display: none; }

    @media (max-width: 768px) {
      .dm-page { padding: 0; }
      .dm-header { position: sticky; top: 0; z-index: 10; background: var(--bg-main); padding: 0.75rem 0.75rem 0; }
      .dm-header h1 { font-size: 1.2rem; margin-bottom: 0.75rem; }
      .new-conversation { position: sticky; top: 56px; z-index: 10; background: var(--bg-main); padding: 0 0.75rem 0.75rem; margin: 0; flex-direction: row; }
      .new-conversation input { height: 44px; }
      .new-conversation button { display: none; }

      .conversation-list { gap: 0; }
      .conversation-card { padding: 0.75rem; border: none; border-radius: 0; border-bottom: 1px solid var(--border-color); gap: 0.75rem; }
      .conversation-card:hover { background: var(--bg-hover); }
      .conversation-info { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; gap: 0.15rem 0.5rem; }
      .conversation-name { grid-row: 1; grid-column: 1; }
      .conversation-time { grid-row: 1; grid-column: 2; text-align: right; margin-top: 0; font-size: 0.688rem; }
      .conversation-preview { grid-row: 2; grid-column: 1 / -1; white-space: normal; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }

      .fab { display: flex; position: fixed; bottom: 72px; right: 16px; z-index: 100; width: 56px; height: 56px; border-radius: 50%; background: var(--accent-color); color: white; border: none; font-size: 1.75rem; font-weight: 300; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.25); cursor: pointer; }
    }
    .conversation-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--accent-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .conversation-info {
      flex: 1;
      min-width: 0;
    }
    .conversation-name {
      font-weight: 600;
      color: var(--text-main);
      font-size: 0.95rem;
    }
    .conversation-preview {
      color: var(--text-muted);
      font-size: 0.85rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .conversation-time {
      color: var(--text-muted);
      font-size: 0.75rem;
      margin-top: 0.15rem;
    }
    .unread-badge {
      background: #e74c3c;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
      min-width: 16px;
      text-align: center;
      line-height: 1.2;
      flex-shrink: 0;
      margin-left: 0.5rem;
    }
  `]
})
export class DmListComponent implements OnInit {
  conversations: ConversationResponse[] = [];
  searchUsername = '';
  loading = false;
  error = '';

  constructor(
    private dmService: DmService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.loading = true;
    this.dmService.getConversations().subscribe({
      next: (list) => {
        this.conversations = list;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  startConversation(): void {
    if (!this.searchUsername.trim()) return;
    this.userService.getUserByUsername(this.searchUsername.trim()).subscribe({
      next: (user) => {
        this.dmService.createConversation({ participantIds: [(user as any).id] }).subscribe({
          next: (conv) => this.router.navigate(['/dm', conv.id]),
          error: (err) => this.error = 'Failed to create conversation'
        });
      },
      error: () => this.error = 'User not found'
    });
  }
}
