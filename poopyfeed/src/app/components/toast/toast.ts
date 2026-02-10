import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

/**
 * Toast notification component
 * Displays a container for toast notifications managed by ToastService
 * Place this component once in your root layout
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[999] space-y-2" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div
          class="min-w-80 max-w-md rounded-lg shadow-lg p-4 border-l-4 animate-in fade-in slide-in-from-top-2 duration-300"
          [ngClass]="getToastClasses(toast.type)"
          role="alert"
        >
          <div class="flex items-start gap-3">
            <span class="text-xl">
              {{ getIconEmoji(toast.type) }}
            </span>
            <div class="flex-1">
              <p class="font-medium">{{ getTitle(toast.type) }}</p>
              <p class="text-sm opacity-90 mt-1">{{ toast.message }}</p>
            </div>
            <button
              (click)="toastService.remove(toast.id)"
              class="text-xl leading-none hover:opacity-70 transition-opacity"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  readonly toastService = inject(ToastService);

  getToastClasses(type: string): string {
    const classes: Record<string, string> = {
      success:
        'bg-emerald-50 border-emerald-400 text-emerald-900 text-opacity-80',
      error: 'bg-red-50 border-red-400 text-red-900 text-opacity-80',
      warning: 'bg-amber-50 border-amber-400 text-amber-900 text-opacity-80',
      info: 'bg-blue-50 border-blue-400 text-blue-900 text-opacity-80',
    };
    return classes[type] || classes['info'];
  }

  getIconEmoji(type: string): string {
    const emojis: Record<string, string> = {
      success: '✓',
      error: '⚠',
      warning: '!',
      info: 'ℹ',
    };
    return emojis[type] || emojis['info'];
  }

  getTitle(type: string): string {
    const titles: Record<string, string> = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
    };
    return titles[type] || titles['info'];
  }
}
