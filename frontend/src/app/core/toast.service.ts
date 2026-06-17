import { Injectable } from '@angular/core';

export type ToastType = 'default' | 'success' | 'error' | 'undo';

export interface Toast {
  id: string;
  message: string;
  hasUndo: boolean;
  durationMs: number;
  type: ToastType;
  onUndo?: () => void;
  onConfirmed?: () => void;
  timeoutId?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: Toast[] = [];

  showUndo(message: string, onUndo: () => void, onConfirmed?: () => void, durationMs = 5000): void {
    const id = Math.random().toString(36).substring(2, 9);
    
    const toast: Toast = {
      id,
      message,
      hasUndo: true,
      durationMs,
      type: 'undo',
      onUndo,
      onConfirmed
    };

    toast.timeoutId = setTimeout(() => {
      this.remove(id);
      if (toast.onConfirmed) toast.onConfirmed();
    }, durationMs);

    this.toasts.push(toast);
  }

  showSuccess(message: string, durationMs = 3000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
      id, message, hasUndo: false, durationMs, type: 'success'
    };
    toast.timeoutId = setTimeout(() => {
      this.remove(id);
    }, durationMs);
    this.toasts.push(toast);
  }

  showError(message: string, durationMs = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
      id, message, hasUndo: false, durationMs, type: 'error'
    };
    toast.timeoutId = setTimeout(() => {
      this.remove(id);
    }, durationMs);
    this.toasts.push(toast);
  }

  show(message: string, durationMs = 3000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
      id, message, hasUndo: false, durationMs, type: 'default'
    };
    toast.timeoutId = setTimeout(() => {
      this.remove(id);
    }, durationMs);
    this.toasts.push(toast);
  }

  undo(id: string): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      if (toast.timeoutId) clearTimeout(toast.timeoutId);
      if (toast.onUndo) toast.onUndo();
      this.remove(id);
    }
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
