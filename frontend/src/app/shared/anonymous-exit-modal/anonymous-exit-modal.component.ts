import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnonymousBrowsingService } from '../../core/anonymous-browsing.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-anonymous-exit-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Action Disabled</h3>
          <button class="close-btn" (click)="close()">&times;</button>
        </div>
        <div class="modal-body">
          <p>This action requires your normal account identity.</p>
          <p class="text-muted">You are currently browsing anonymously.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="close()">Cancel</button>
          <button class="btn-primary" (click)="disableAnonymousMode()">Disable Anonymous Browsing</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .modal-content {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      animation: modalSlideIn 0.2s ease-out;
    }
    @keyframes modalSlideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--text-main);
    }
    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      color: var(--text-muted);
      cursor: pointer;
    }
    .close-btn:hover {
      color: var(--text-main);
    }
    .modal-body {
      padding: 1.5rem;
      color: var(--text-main);
    }
    .modal-body p {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }
    .text-muted {
      color: var(--text-muted);
      font-size: 0.9rem !important;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      background: var(--bg-hover);
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary:hover {
      background: var(--bg-main);
    }
    .btn-primary {
      background: var(--text-main);
      color: var(--bg-main);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:hover {
      opacity: 0.8;
    }
  `]
})
export class AnonymousExitModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  private sub?: Subscription;

  constructor(private anonymousBrowsingService: AnonymousBrowsingService) {}

  ngOnInit(): void {
    this.sub = this.anonymousBrowsingService.exitPrompt$.subscribe(() => {
      this.isOpen = true;
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  close(): void {
    this.isOpen = false;
  }

  disableAnonymousMode(): void {
    this.anonymousBrowsingService.setAnonymousMode(false);
    this.isOpen = false;
  }
}
