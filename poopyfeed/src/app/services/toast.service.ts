import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, undefined = sticky
}

/**
 * Service for managing toast notifications
 * Provides reactive signal-based state management for toasts
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  readonly toasts$ = this.toasts.asReadonly();
  private nextId = 0;

  /**
   * Show a success toast notification
   */
  success(message: string, duration = 4000): string {
    return this.show(message, 'success', duration);
  }

  /**
   * Show an error toast notification
   */
  error(message: string, duration = 5000): string {
    return this.show(message, 'error', duration);
  }

  /**
   * Show a warning toast notification
   */
  warning(message: string, duration = 4000): string {
    return this.show(message, 'warning', duration);
  }

  /**
   * Show an info toast notification
   */
  info(message: string, duration = 3000): string {
    return this.show(message, 'info', duration);
  }

  /**
   * Add a custom toast
   * @param message - Toast message
   * @param type - Toast type (success, error, warning, info)
   * @param duration - Duration in ms (undefined = sticky)
   */
  show(message: string, type: ToastType = 'info', duration?: number): string {
    const id = this.generateId();
    const toast: Toast = { id, type, message, duration };

    this.toasts.update((current) => [...current, toast]);

    // Auto-remove after duration if specified
    if (duration !== undefined && duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  /**
   * Remove a toast by ID
   */
  remove(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  /**
   * Remove all toasts
   */
  clear(): void {
    this.toasts.set([]);
  }

  private generateId(): string {
    return `toast-${++this.nextId}-${Date.now()}`;
  }
}
