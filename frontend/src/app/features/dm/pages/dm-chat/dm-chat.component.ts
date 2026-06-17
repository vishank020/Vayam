import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, fromEvent } from 'rxjs';
import { DmService, MessageResponse } from '../../../../core/dm.service';
import { AuthService } from '../../../../core/auth.service';
import { WebSocketService } from '../../../../core/websocket.service';

@Component({
  selector: 'app-dm-chat',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="chat-page">
      <a routerLink="/dm" class="back-link">&larr; Back to Messages</a>

      <div *ngIf="loading" class="chat-skeleton">
        <div class="skeleton skeleton-text-sm" style="width: 140px; margin-bottom: 1rem;"></div>
        <div class="skeleton chat-bubble" style="width: 60%; align-self: flex-start;"></div>
        <div class="skeleton chat-bubble" style="width: 45%; align-self: flex-end;"></div>
        <div class="skeleton chat-bubble" style="width: 70%; align-self: flex-start;"></div>
        <div class="skeleton chat-bubble" style="width: 50%; align-self: flex-end;"></div>
        <div class="skeleton chat-bubble" style="width: 55%; align-self: flex-start;"></div>
      </div>

      <div class="message-list" #messageList *ngIf="!loading">
        <div
          *ngFor="let msg of messages"
          class="message-wrapper"
          [ngClass]="{'own': msg.senderId === currentUserId}"
        >
          <div class="message" [ngClass]="{'own-bubble': msg.senderId === currentUserId}">
            <!-- Edit Mode -->
            <div *ngIf="editingMessageId === msg.id" class="edit-mode">
              <input [(ngModel)]="editingText" (keyup.enter)="saveEdit(msg)" class="edit-input" />
              <div class="edit-actions">
                <button (click)="saveEdit(msg)">Save</button>
                <button (click)="cancelEdit()">Cancel</button>
              </div>
            </div>
            
            <!-- Normal Mode -->
            <div *ngIf="editingMessageId !== msg.id">
              <div class="message-body">
                {{ msg.body }}
                <span *ngIf="msg.isEdited && !msg.isDeleted" class="edited-label">(edited)</span>
              </div>
              <div class="message-time">
                <span>{{ msg.sentAt | date:'h:mm a' }}</span>
                <span *ngIf="msg.senderId === currentUserId && msg.readAt" class="read-indicator"> ✓✓</span>
              </div>
            </div>

            <!-- Hover menu for own messages -->
            <div class="hover-menu" *ngIf="msg.senderId === currentUserId && !msg.isDeleted && editingMessageId !== msg.id">
              <button class="menu-btn" (click)="startEdit(msg)" title="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="menu-btn danger" (click)="deleteMsg(msg)" title="Delete for everyone">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
        <div *ngIf="messages.length === 0" class="empty">
          No messages yet. Send one below!
        </div>
      </div>

      <div class="message-form">
        <input
          [(ngModel)]="newMessage"
          placeholder="Type a message..."
          (keyup.enter)="send()"
          [disabled]="sending"
        />
        <button class="send-btn" (click)="send()" [disabled]="!newMessage.trim() || sending">
          <span class="send-text">{{ sending ? '...' : 'Send' }}</span>
          <svg class="send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-page {
      max-width: 640px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      height: calc(100vh - var(--header-height, 56px) - 3rem);
    }
    .back-link {
      color: var(--accent-color);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 0.75rem;
    }
    .back-link:hover { text-decoration: underline; }
    .loading, .empty {
      text-align: center;
      color: var(--text-muted);
      padding: 2rem 0;
    }
    .chat-skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }
    .chat-bubble {
      height: 48px;
      border-radius: 12px;
    }
    .message-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding: 0.5rem 0;
    }
    .message-wrapper {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .message-wrapper.own {
      align-items: flex-end;
    }
    .message {
      max-width: 75%;
      padding: 0.5rem 0.75rem;
      border-radius: 12px;
      font-size: 0.95rem;
      line-height: 1.4;
      background: var(--bg-elevated);
      position: relative;
    }
    .message.own-bubble {
      background: var(--accent-color);
      color: white;
    }
    .message:hover .hover-menu {
      display: flex;
    }
    .hover-menu {
      display: none;
      position: absolute;
      top: -24px;
      right: 4px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 2px;
      gap: 2px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      z-index: 10;
    }
    .own-bubble .hover-menu {
      left: 4px;
      right: auto;
    }
    .menu-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: var(--text-muted);
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .menu-btn:hover {
      background: var(--bg-hover);
      color: var(--text-main);
    }
    .menu-btn.danger:hover {
      color: var(--danger);
    }
    .edited-label {
      font-size: 0.75rem;
      opacity: 0.6;
      margin-left: 0.25rem;
    }
    .edit-mode {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 150px;
    }
    .edit-input {
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      font-size: 0.9rem;
      width: 100%;
      box-sizing: border-box;
      background: var(--bg-main);
      color: var(--text-main);
    }
    .edit-actions {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
    }
    .edit-actions button {
      padding: 2px 8px;
      font-size: 0.75rem;
      cursor: pointer;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--bg-main);
      color: var(--text-main);
    }
    .edit-actions button:first-child {
      background: var(--accent-color);
      color: white;
      border-color: var(--accent-color);
    }
    .message-body { word-wrap: break-word; }
    .message-time {
      font-size: 0.7rem;
      opacity: 0.7;
      margin-top: 0.2rem;
      text-align: right;
    }
    .read-indicator { color: var(--accent-color); opacity: 1; }
    .message-form {
      display: flex;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }
    .message-form input {
      flex: 1;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      font-size: 0.9rem;
    }
    .message-form input:focus {
      outline: none;
      border-color: var(--accent-color);
    }
    .message-form button {
      padding: 0.5rem 1.25rem;
      background: var(--accent-color);
      color: white;
      border: none;
      border-radius: 20px;
      font-weight: 600;
      cursor: pointer;
    }
    .message-form button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .send-icon { display: none; }

    @media (max-width: 768px) {
      .chat-page { padding: 0; max-width: 100%; height: calc(100vh - var(--header-height, 56px) - 56px); }
      .back-link { position: sticky; top: 0; z-index: 10; background: var(--bg-main); padding: 0.75rem; margin: 0; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.5rem; width: 100%; font-size: 1rem; box-sizing: border-box; }
      .message-list { padding: 0.5rem 0.75rem; padding-bottom: 70px; }
      .message { max-width: 75%; font-size: 0.9rem; }
      .message-form { position: fixed; bottom: 56px; left: 0; right: 0; z-index: 100; background: var(--bg-main); padding: 0.6rem 0.75rem; border-top: 1px solid var(--border-color); gap: 0.5rem; box-sizing: border-box; }
      .message-form input { flex: 1; padding: 0.6rem 0.75rem; border: 1px solid var(--border-color); border-radius: 20px; font-size: 0.9rem; font-family: inherit; background: var(--bg-main); color: var(--text-main); outline: none; box-sizing: border-box; height: 44px; }
      .message-form input:focus { border-color: var(--accent-color); }
      .send-btn { width: 44px; height: 44px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--accent-color); color: white; border: none; cursor: pointer; }
      .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .send-text { display: none; }
      .send-icon { display: block; }
    }
  `]
})
export class DmChatComponent implements OnInit, OnDestroy {
  conversationId: string | null = null;
  messages: MessageResponse[] = [];
  newMessage = '';
  loading = false;
  sending = false;
  currentUserId: string | null = null;

  @ViewChild('messageList') messageListRef!: ElementRef;

  private wsSubscription: Subscription | null = null;
  private focusSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private dmService: DmService,
    private authService: AuthService,
    private wsService: WebSocketService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.conversationId = this.route.snapshot.paramMap.get('id');
    this.authService.checkAuth().subscribe(u => {
      if (u) this.currentUserId = u.id;
    });
    if (this.conversationId) {
      this.loadMessages();
      this.subscribeToConversation();
      this.markAsRead();
    }
    this.focusSubscription = fromEvent(window, 'focus').subscribe(() => {
      if (this.conversationId) this.markAsRead();
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.focusSubscription) {
      this.focusSubscription.unsubscribe();
    }
  }

  private markAsRead(): void {
    if (!this.conversationId) return;
    this.dmService.markAsRead(this.conversationId).subscribe();
  }

  private subscribeToConversation(): void {
    if (!this.conversationId) return;
    this.wsSubscription = this.wsService.subscribeToConversation(this.conversationId).subscribe({
      next: (msg: MessageResponse) => {
        if (msg.body === 'READ_RECEIPT') {
          // Other participant marked our messages as read
          this.messages.forEach(m => {
            if (m.senderId === this.currentUserId && !m.readAt) {
              m.readAt = msg.sentAt;
            }
          });
          return;
        }

        const idx = this.messages.findIndex(m => m.id === msg.id);
        if (idx !== -1) {
          // Message edited or deleted
          this.messages[idx].body = msg.body;
          this.messages[idx].isEdited = msg.isEdited;
          this.messages[idx].isDeleted = msg.isDeleted;
        } else {
          // New message
          this.messages.push(msg);
          if (msg.senderId !== this.currentUserId) {
            this.markAsRead();
          }
          setTimeout(() => this.scrollToBottom());
        }
      }
    });
  }

  loadMessages(): void {
    this.loading = true;
    this.dmService.getMessages(this.conversationId!, 0, 200).subscribe({
      next: (res) => {
        this.messages = [...res.content].reverse();
        this.loading = false;
        setTimeout(() => this.scrollToBottom());
      },
      error: () => this.loading = false
    });
  }

  send(): void {
    if (!this.newMessage.trim() || !this.conversationId) return;
    this.sending = true;
    this.dmService.sendMessage(this.conversationId, this.newMessage).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.newMessage = '';
        this.sending = false;
        setTimeout(() => this.scrollToBottom());
      },
      error: () => this.sending = false
    });
  }

  private scrollToBottom(): void {
    if (this.messageListRef) {
      this.messageListRef.nativeElement.scrollTop = this.messageListRef.nativeElement.scrollHeight;
    }
  }

  editingMessageId: string | null = null;
  editingText = '';

  startEdit(msg: MessageResponse): void {
    this.editingMessageId = msg.id;
    this.editingText = msg.body;
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editingText = '';
  }

  saveEdit(msg: MessageResponse): void {
    if (!this.editingText.trim() || !this.conversationId) return;
    this.dmService.editMessage(this.conversationId, msg.id, this.editingText).subscribe({
      next: (updated) => {
        msg.body = updated.body;
        msg.isEdited = true;
        this.cancelEdit();
      },
      error: () => {}
    });
  }

  deleteMsg(msg: MessageResponse): void {
    if (!confirm('Are you sure you want to delete this message for everyone?') || !this.conversationId) return;
    this.dmService.deleteMessage(this.conversationId, msg.id).subscribe({
      next: () => {
        msg.body = '[Message deleted]';
        msg.isDeleted = true;
      },
      error: () => {}
    });
  }
}
