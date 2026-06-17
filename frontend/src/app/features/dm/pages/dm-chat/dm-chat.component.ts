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
          class="message"
          [ngClass]="{'own': msg.senderId === currentUserId}"
        >
          <div class="message-body">{{ msg.body }}</div>
          <div class="message-time">
            <span>{{ msg.sentAt | date:'h:mm a' }}</span>
            <span *ngIf="msg.senderId === currentUserId && msg.readAt" class="read-indicator"> ✓✓</span>
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
    .message {
      max-width: 75%;
      padding: 0.5rem 0.75rem;
      border-radius: 12px;
      font-size: 0.95rem;
      line-height: 1.4;
      align-self: flex-start;
      background: var(--bg-elevated);
    }
    .message.own {
      align-self: flex-end;
      background: var(--accent-color);
      color: white;
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
        if (!this.messages.some(m => m.id === msg.id)) {
          this.messages.push(msg);
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
}
