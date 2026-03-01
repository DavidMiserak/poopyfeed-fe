import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';

/**
 * Reusable confirmation modal dialog.
 * Replaces browser confirm() with a styled overlay and explicit Confirm/Cancel.
 * Used by sharing (revoke, delete invite) and catch-up (discard, delete event).
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class ConfirmDialogComponent {
  title = input<string>('');
  message = input.required<string>();
  confirmLabel = input<string>('Confirm');
  cancelLabel = input<string>('Cancel');
  /** 'danger' for destructive (red), 'primary' for rose/orange */
  variant = input<'danger' | 'primary'>('primary');

  confirmed = output<void>();
  cancelled = output<void>();

  onEscape(): void {
    this.cancelled.emit();
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement)?.getAttribute('data-backdrop') === 'true') {
      this.cancelled.emit();
    }
  }
}
