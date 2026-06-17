import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth.service';
import { PostService } from '../../../../core/post.service';
import { CommunityService, CommunityMemberResponse } from '../../../../core/community.service';
import { AnonymousBrowsingService } from '../../../../core/anonymous-browsing.service';
import { ToastService } from '../../../../core/toast.service';

@Component({
  selector: 'app-post-actions-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
          <a [routerLink]="['/posts', postId, 'edit']" class="menu-item" (click)="closeMenu()">
            Edit Post
          </a>
          <button class="menu-item text-danger" (click)="deletePost()">
            Delete Post
          </button>
          <button class="menu-item" (click)="copyLink()">
            Copy Link
          </button>
          <button class="menu-item disabled" disabled>
            Pin Post <span class="badge">Soon</span>
          </button>
          <button class="menu-item disabled" disabled>
            View Insights <span class="badge">Soon</span>
          </button>
        </ng-container>

        <!-- VIEWER MENU -->
        <ng-container *ngIf="!isOwner">
          <button class="menu-item" (click)="followPost()">
            Follow Post
          </button>
          <button class="menu-item" (click)="notInterested()">
            Not Interested
          </button>
          <button class="menu-item" (click)="savePost()">
            {{ isSaved ? 'Unsave Post' : 'Save Post' }}
          </button>
          <button class="menu-item" (click)="openReportModal()">
            Report Post
          </button>
          
          <div class="menu-divider"></div>

          <button class="menu-item disabled" disabled>
            Add To Collection <span class="badge">Soon</span>
          </button>
        </ng-container>

      </div>
    </div>

    <!-- Report Modal -->
    <div class="modal-overlay" *ngIf="showReportModal" (click)="closeReportModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3>Report Post</h3>
        <p class="modal-subtitle">Help us understand what's happening.</p>
        
        <div class="report-options">
          <label class="radio-label" *ngFor="let reason of reportReasons">
            <input type="radio" name="reportReason" [value]="reason" [(ngModel)]="selectedReason">
            <span>{{ reason }}</span>
          </label>
        </div>

        <div class="custom-reason" *ngIf="selectedReason === 'Other'">
          <textarea [(ngModel)]="customReason" placeholder="Please provide more details..." rows="3"></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" (click)="closeReportModal()">Cancel</button>
          <button class="btn-submit" (click)="submitReport()" [disabled]="!canSubmitReport()">Submit</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .menu-container { position: relative; display: inline-block; }
    
    .trigger-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.4rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background-color 0.15s, color 0.15s; width: 36px; height: 36px; }
    .trigger-btn:hover { background-color: var(--bg-hover); color: var(--text-main); }
    
    .dropdown-menu { position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 240px; z-index: 1000; overflow: hidden; display: flex; flex-direction: column; padding: 0.5rem 0; }
    
    .menu-item { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem 1.25rem; background: transparent; border: none; color: var(--text-main); font-size: 0.95rem; font-weight: 500; text-align: left; cursor: pointer; text-decoration: none; transition: background-color 0.1s; }
    .menu-item:hover:not(.disabled) { background-color: var(--bg-hover); }
    .menu-item.disabled { opacity: 0.5; cursor: not-allowed; }
    
    .text-danger { color: var(--danger); }
    .text-danger:hover { background-color: rgba(239, 68, 68, 0.1); }
    
    .icon { font-size: 1.1rem; width: 20px; text-align: center; }
    .badge { margin-left: auto; font-size: 0.65rem; background: var(--border-color); color: var(--text-muted); padding: 0.1rem 0.4rem; border-radius: 9999px; font-weight: 700; text-transform: uppercase; }
    
    .menu-divider { height: 1px; background-color: var(--border-color); margin: 0.5rem 0; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
    .modal-content { background: var(--bg-elevated); border-radius: 16px; padding: 2rem; width: 100%; max-width: 400px; border: 1px solid var(--border-color); }
    .modal-content h3 { margin: 0 0 0.25rem; font-size: 1.25rem; font-weight: 800; color: var(--text-main); }
    .modal-subtitle { margin: 0 0 1.5rem; color: var(--text-muted); font-size: 0.9rem; }
    
    .report-options { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
    .radio-label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; font-size: 0.95rem; color: var(--text-main); font-weight: 500; }
    .radio-label input[type="radio"] { accent-color: var(--text-main); width: 1.1rem; height: 1.1rem; }
    
    .custom-reason textarea { width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main); font-family: inherit; font-size: 0.9rem; resize: vertical; margin-bottom: 1.5rem; box-sizing: border-box; }
    .custom-reason textarea:focus { outline: none; border-color: var(--text-main); }
    
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
    .btn-cancel, .btn-submit { padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: opacity 0.15s; }
    .btn-cancel { background: transparent; border: 1px solid var(--border-color); color: var(--text-main); }
    .btn-cancel:hover { background: var(--bg-hover); }
    .btn-submit { background: var(--danger); border: 1px solid var(--danger); color: white; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-submit:hover:not(:disabled) { opacity: 0.9; }
    
    @media (max-width: 600px) {
      .dropdown-menu { position: fixed; top: auto; bottom: 0; left: 0; right: 0; width: 100%; border-radius: 20px 20px 0 0; padding: 1rem 0 2rem; border-bottom: none; box-shadow: 0 -5px 20px rgba(0,0,0,0.2); max-height: 85vh; overflow-y: auto; }
      .menu-item { padding: 1rem 1.5rem; font-size: 1.05rem; }
    }
  `]
})
export class PostActionsMenuComponent implements OnInit {
  @Input() postId!: string;
  @Input() authorId?: string | null;
  @Input() authorUsername?: string | null;
  @Input() isSaved = false;
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() hidden = new EventEmitter<void>();
  @Input() targetMember?: CommunityMemberResponse | null;
  @Input() currentUserId?: string | null;
  @Input() communityRole?: string | null;
  @Output() promoteRequested = new EventEmitter<{ targetMember: CommunityMemberResponse; newRole: 'ADMIN' | 'MOD' | 'MEMBER' }>();
  @Output() removeRequested = new EventEmitter<CommunityMemberResponse>();
  @Output() banRequested = new EventEmitter<CommunityMemberResponse>();

  isOpen = false;
  isOwner = false;
  
  // Report modal state
  showReportModal = false;
  reportReasons = ['Spam', 'Harassment', 'Hate Speech', 'Misinformation', 'NSFW', 'Other'];
  selectedReason = '';
  customReason = '';

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private communityService: CommunityService,
    private toastService: ToastService,
    private anonymousBrowsingService: AnonymousBrowsingService,
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
    this.closeReportModal();
  }

  // --- Owner Actions ---

  deletePost(): void {
    this.closeMenu();
    this.deleteRequested.emit();
  }

  // --- Shared Actions ---

  copyLink(): void {
    this.closeMenu();
    const url = `${window.location.origin}/posts/${this.postId}`;
      navigator.clipboard.writeText(url).then(() => {
      this.toastService.showSuccess('Link copied to clipboard');
    });
  }

  // --- Viewer Actions ---

  savePost(): void {
    this.closeMenu();
    if (!this.anonymousBrowsingService.interceptAction()) return;
    const currentlySaved = this.isSaved;
    const request = currentlySaved
      ? this.postService.unsavePost(this.postId)
      : this.postService.savePost(this.postId);
    request.subscribe({
      next: () => {
        this.isSaved = !currentlySaved;
        this.toastService.showSuccess(currentlySaved ? 'Post unsaved' : 'Post saved');
      },
      error: () => {
        this.toastService.showError('Failed to save post');
      }
    });
  }

  followPost(): void {
    this.closeMenu();
    if (!this.anonymousBrowsingService.interceptAction()) return;
    // TODO: simulated — backend endpoint not yet implemented
    this.toastService.show('Follow feature coming soon (missing backend support).');
  }

  notInterested(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    this.closeMenu();
    this.hidden.emit();
  }

  // --- Report Actions ---

  openReportModal(): void {
    this.closeMenu();
    if (!this.anonymousBrowsingService.interceptAction()) return;
    this.showReportModal = true;
    this.selectedReason = '';
    this.customReason = '';
  }

  closeReportModal(): void {
    this.showReportModal = false;
  }

  canSubmitReport(): boolean {
    if (!this.selectedReason) return false;
    if (this.selectedReason === 'Other' && !this.customReason.trim()) return false;
    return true;
  }

  submitReport(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    const reason = this.selectedReason === 'Other' ? this.customReason.trim() : this.selectedReason;
    this.postService.reportPost(this.postId, reason).subscribe({
      next: () => {
        this.closeReportModal();
        this.toastService.showSuccess('Post reported');
      },
      error: () => {
        this.toastService.showError('Failed to report post');
      }
    });
  }
}
