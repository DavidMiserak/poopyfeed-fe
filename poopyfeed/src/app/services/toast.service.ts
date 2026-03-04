import { Injectable, signal } from '@angular/core';

/** Toast variant for styling and icons. */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Single toast item in the list. */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Duration in ms; undefined = sticky (no auto-dismiss) */
  duration?: number;
}

/**
 * Service for managing toast notifications.
 *
 * Provides reactive signal-based state (toasts$). Use success(), error(),
 * warning(), info() for common types, or show() for custom type/duration.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  /** Readonly signal of current toasts for template binding. */
  readonly toasts$ = this.toasts.asReadonly();
  private nextId = 0;

  /**
   * Show a success toast (default 4s).
   *
   * @param message - Text to display
   * @param duration - Ms before auto-dismiss (default 4000)
   * @returns Toast ID for manual remove()
   */
  success(message: string, duration = 4000): string {
    return this.show(message, 'success', duration);
  }

  /**
   * Show an error toast (default 5s).
   *
   * @param message - Text to display
   * @param duration - Ms before auto-dismiss (default 5000)
   * @returns Toast ID for manual remove()
   */
  error(message: string, duration = 5000): string {
    return this.show(message, 'error', duration);
  }

  /**
   * Show a warning toast (default 4s).
   *
   * @param message - Text to display
   * @param duration - Ms before auto-dismiss (default 4000)
   * @returns Toast ID for manual remove()
   */
  warning(message: string, duration = 4000): string {
    return this.show(message, 'warning', duration);
  }

  /**
   * Show an info toast (default 3s).
   *
   * @param message - Text to display
   * @param duration - Ms before auto-dismiss (default 3000)
   * @returns Toast ID for manual remove()
   */
  info(message: string, duration = 3000): string {
    return this.show(message, 'info', duration);
  }

  /**
   * Add a toast with custom type and duration.
   *
   * @param message - Toast message text
   * @param type - Toast type (success, error, warning, info)
   * @param duration - Ms before auto-dismiss; undefined = sticky
   * @returns Toast ID (use remove(id) to dismiss early)
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
   * Remove a toast by ID.
   *
   * @param id - ID returned from show() or success()/error()/etc.
   */
  remove(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  /**
   * Remove all toasts.
   */
  clear(): void {
    this.toasts.set([]);
  }

  private generateId(): string {
    return `toast-${++this.nextId}-${Date.now()}`;
  }
}
