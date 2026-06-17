import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../core/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toastService.toasts.length > 0">
      <div *ngFor="let toast of toastService.toasts" class="toast" [class.toast--success]="toast.type === 'success'" [class.toast--error]="toast.type === 'error'" [class.toast--undo]="toast.type === 'undo'">
        <span class="toast-message">{{ toast.message }}</span>
        <button *ngIf="toast.hasUndo" class="btn-undo" (click)="undo(toast)">Undo</button>
        <button *ngIf="!toast.hasUndo" class="btn-close" (click)="toastService.remove(toast.id)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: none;
    }
    
    .toast {
      background-color: var(--text-main);
      color: var(--bg-main);
      padding: 0.8rem 1.2rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      pointer-events: auto;
      font-weight: 500;
      font-size: 0.95rem;
      animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes slideUp {
      0% { opacity: 0; transform: translateY(20px) scale(0.9); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    .toast-message { flex-grow: 1; }

    .btn-undo {
      background: transparent;
      color: var(--accent-color);
      border: none;
      font-weight: 800;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      padding: 0 0.5rem;
      transition: opacity 0.2s;
    }
    .btn-undo:hover { opacity: 0.7; }
    
    .btn-close {
      background: transparent;
      border: none;
      color: var(--bg-main);
      opacity: 0.7;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      transition: opacity 0.2s;
    }
    .btn-close:hover { opacity: 1; }

    .toast--success { border-left: 4px solid var(--color-success, #22c55e); }
    .toast--error { border-left: 4px solid var(--color-error, #ef4444); }
    .toast--undo { border-left: 4px solid var(--accent-color); }
  `]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}

  undo(toast: Toast): void {
    this.toastService.undo(toast.id);
  }
}
