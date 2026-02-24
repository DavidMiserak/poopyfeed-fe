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
  templateUrl: './toast.html',
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
