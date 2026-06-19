import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { NotificationService, NotificationResponse } from '../../../core/notification.service';
import { WebSocketService } from '../../../core/websocket.service';
import { Subscription } from 'rxjs';
import { CommentSkeletonComponent } from '../../../shared/components/comment-skeleton.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink, CommentSkeletonComponent],
  template: `
    <div class="notification-wrapper">
      <button class="bell-button" (click)="toggleDropdown()" [attr.aria-label]="'Notifications' + (unreadCount > 0 ? ', ' + unreadCount + ' unread' : '')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

      <div class="dropdown" *ngIf="open">
        <div class="dropdown-header">
          <h4>Notifications</h4>
          <button class="btn-mark-read" *ngIf="unreadCount > 0" (click)="markAllRead()">Mark all read</button>
        </div>

        <div class="notifications-list">
          <app-comment-skeleton *ngIf="loading" [count]="5"></app-comment-skeleton>
          <div *ngIf="!loading && notifications.length === 0" class="empty">No notifications yet</div>

          <div
            class="notification-item"
            *ngFor="let n of notifications"
            [class.unread]="!n.isRead"
            (click)="clickNotification(n)"
          >
            <a class="notification-avatar" [routerLink]="['/u', n.actorUsername]" (click)="$event.stopPropagation(); close()">
              <div *ngIf="n.actorAvatarUrl" class="img-wrapper" style="width: 36px; height: 36px; border-radius: 50%;">
                <div class="skeleton skeleton-overlay" *ngIf="!isImageLoaded(n.actorAvatarUrl)" style="border-radius: 50%;"></div>
                <img [src]="n.actorAvatarUrl" (load)="onImageLoaded(n.actorAvatarUrl)" class="notif-avatar-img" alt="avatar" />
              </div>
              <div *ngIf="!n.actorAvatarUrl" class="notif-avatar-initials">
                {{ (n.actorUsername || '?')[0] | uppercase }}
              </div>
            </a>
            <div class="item-content">
              <div class="item-type">{{ typeLabel(n.type) }}</div>
              <p class="item-message">{{ n.message }}</p>
              <span class="item-time">{{ n.createdAt | date:'short' }}</span>
            </div>
            <button class="btn-mark-single-read" *ngIf="!n.isRead" (click)="markSingleAsRead(n, $event)" title="Mark as read">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="backdrop" *ngIf="open" (click)="close()"></div>
    </div>
  `,
  styles: [`
    .notification-wrapper {
      position: relative;
    }
    .bell-button {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      padding: 0.35rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
    }
    .bell-button:hover {
      background: var(--bg-hover);
    }
    .badge {
      position: absolute;
      top: -2px;
      right: -4px;
      background: #e74c3c;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 8px;
      min-width: 16px;
      text-align: center;
      line-height: 1.2;
    }
    .dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      width: min(340px, calc(100vw - 1rem));
      max-height: 420px;
      background: var(--bg-main);
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    .dropdown-header h4 {
      margin: 0;
      font-size: 0.95rem;
      color: var(--text-main);
    }
    .btn-mark-read {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 0.8rem;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-mark-read:hover {
      text-decoration: underline;
    }
    .notifications-list {
      overflow-y: auto;
      max-height: 360px;
    }
    .loading, .empty {
      padding: 1.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .notification-item {
      padding: 0.65rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color);
      transition: background 0.15s;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .notification-item:hover {
      background: var(--bg-hover);
    }
    .notification-item.unread {
      background: var(--bg-elevated);
      color: var(--text-main);
    }
    .notification-item.unread:hover {
      background: var(--bg-hover);
    }
    .notification-item.unread .item-message {
      color: var(--text-main);
    }
    .notification-item.unread .item-time {
      color: var(--text-muted);
    }
    .notification-item.unread .item-type {
      color: var(--accent-color);
    }
    .notification-avatar {
      margin-right: 0.75rem;
      flex-shrink: 0;
      text-decoration: none;
    }
    .notif-avatar-img, .notif-avatar-initials {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }
    .notif-avatar-initials {
      background: var(--text-main);
      color: var(--bg-main);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 700;
    }
    .item-content {
      flex: 1;
      padding-right: 0.5rem;
    }
    .item-type {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .item-message {
      margin: 0.2rem 0;
      font-size: 0.88rem;
      color: var(--text-main);
      line-height: 1.3;
    }
    .item-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .btn-mark-single-read {
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s;
    }
    .btn-mark-single-read:hover {
      background: rgba(var(--primary-rgb), 0.1);
      color: #3a5ce5;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 999;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  open = false;
  notifications: NotificationResponse[] = [];
  unreadCount = 0;
  loading = false;
  loadedImages = new Set<string>();

  onImageLoaded(url: string): void {
    this.loadedImages.add(url);
  }

  isImageLoaded(url: string): boolean {
    return this.loadedImages.has(url);
  }
  private sub = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private wsService: WebSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.wsService.connect();
    this.notificationService.getUnreadCount().subscribe();
    this.sub.add(this.notificationService.unreadCount$.subscribe(c => this.unreadCount = c));

    this.sub.add(this.wsService.subscribeToNotifications().subscribe({
      next: (notification: NotificationResponse) => {
        this.notifications = [notification, ...this.notifications];
        this.notificationService.addUnread();
      }
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  toggleDropdown(): void {
    if (this.open) {
      this.close();
    } else {
      this.open = true;
      this.loadNotifications();
    }
  }

  close(): void {
    this.open = false;
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.notifications = res.content;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  clickNotification(n: NotificationResponse): void {
    if (!n.isRead) {
      this.notificationService.markAsRead(n.id).subscribe({
        next: () => {
          n.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      });
    }

    if (n.referenceType === 'post' && n.referenceId) {
      this.open = false;
      this.router.navigate(['/posts', n.referenceId]);
    } else if (n.referenceType === 'question' && n.referenceId) {
      this.open = false;
      this.router.navigate(['/questions', n.referenceId]);
    } else if (n.referenceType === 'user' && n.actorUsername) {
      this.open = false;
      this.router.navigate(['/u', n.actorUsername]);
    }
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
      }
    });
  }

  markSingleAsRead(n: NotificationResponse, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(n.id).subscribe({
      next: () => {
        n.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    });
  }

  typeLabel(type: string): string {
    switch (type) {
      case 'FOLLOW': return 'New Follower';
      case 'COMMENT': return 'New Comment';
      case 'LIKE': return 'Like';
      case 'MENTION': return 'Mention';
      case 'ANSWER': return 'New Answer';
      case 'ANSWER_ACCEPT': return 'Answer Accepted';
      default: return type;
    }
  }
}
