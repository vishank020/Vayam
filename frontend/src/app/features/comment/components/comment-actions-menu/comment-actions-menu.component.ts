import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth.service';
import { CommentService } from '../../../../core/comment.service';
import { ToastService } from '../../../../core/toast.service';
import { AnonymousBrowsingService } from '../../../../core/anonymous-browsing.service';

@Component({
  selector: 'app-comment-actions-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="menu-container">
      <button class="trigger-btn" (click)="toggleMenu($event)" title="More options">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="5" r="1.5"></circle>
          <circle cx="12" cy="12" r="1.5"></circle>
          <circle cx="12" cy="19" r="1.5"></circle>
        </svg>
      </button>

      <div class="dropdown-menu" *ngIf="isOpen" (click)="$event.stopPropagation()">
        
        <!-- OWNER MENU -->
        <ng-container *ngIf="isOwner">
          <button class="menu-item" (click)="editComment()">
            Edit Comment
          </button>
          <button class="menu-item text-danger" (click)="deleteComment()">
            Delete Comment
          </button>
          <button class="menu-item" (click)="copyLink()">
            Copy Link
          </button>
        </ng-container>

        <!-- VIEWER MENU -->
        <ng-container *ngIf="!isOwner">
          <button class="menu-item" (click)="copyLink()">
            Copy Link
          </button>
          <a *ngIf="authorUsername" [routerLink]="['/u', authorUsername]" class="menu-item" (click)="closeMenu()">
            View Profile
          </a>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .menu-container { position: relative; display: inline-block; }
    
    .trigger-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background-color 0.15s, color 0.15s; width: 32px; height: 32px; margin-top: -6px; margin-right: -8px; }
    .trigger-btn:hover { background-color: var(--bg-hover); color: var(--text-main); }
    
    .dropdown-menu { position: absolute; top: 100%; right: 0; margin-top: 0.2rem; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 220px; z-index: 1000; overflow: hidden; display: flex; flex-direction: column; padding: 0.5rem 0; }
    
    .menu-item { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem 1.25rem; background: transparent; border: none; color: var(--text-main); font-size: 0.95rem; font-weight: 500; text-align: left; cursor: pointer; text-decoration: none; transition: background-color 0.1s; }
    .menu-item:hover:not(.disabled) { background-color: var(--bg-hover); }
    .menu-item.disabled { opacity: 0.5; cursor: not-allowed; }
    
    .text-danger { color: var(--danger); }
    .text-danger:hover { background-color: rgba(239, 68, 68, 0.1); }
    
    @media (max-width: 600px) {
      .dropdown-menu { position: fixed; top: auto; bottom: 0; left: 0; right: 0; width: 100%; border-radius: 20px 20px 0 0; padding: 1rem 0 2rem; border-bottom: none; box-shadow: 0 -5px 20px rgba(0,0,0,0.2); max-height: 85vh; overflow-y: auto; }
      .menu-item { padding: 1rem 1.5rem; font-size: 1.05rem; }
    }
  `]
})
export class CommentActionsMenuComponent implements OnInit {
  @Input() postId!: string;
  @Input() commentId!: string;
  @Input() authorId?: string | null;
  @Input() authorUsername?: string | null;
  
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<void>();

  isOpen = false;
  isOwner = false;

  constructor(
    private authService: AuthService,
    private anonymousBrowsingService: AnonymousBrowsingService,
    private toastService: ToastService,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.authService.checkAuth().subscribe(u => {
      if (!u) {
        this.isOwner = false;
      } else if (this.authorId && u.id === this.authorId) {
        this.isOwner = true;
      } else if (this.authorUsername && u.username === this.authorUsername) {
        this.isOwner = true;
      } else {
        this.isOwner = false;
      }
    });
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  closeMenu(): void {
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    this.closeMenu();
  }

  // --- Owner Actions ---

  editComment(): void {
    this.closeMenu();
    this.editRequested.emit();
  }

  deleteComment(): void {
    this.closeMenu();
    this.deleteRequested.emit();
  }

  // --- Shared Actions ---

  copyLink(): void {
    this.closeMenu();
    const url = `${window.location.origin}/posts/${this.postId}#comment-${this.commentId}`;
    navigator.clipboard.writeText(url).then(
      () => this.toastService.showSuccess('Link copied to clipboard'),
      () => this.toastService.showError('Could not copy link.')
    );
  }
}
