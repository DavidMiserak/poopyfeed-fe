import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { TimezoneCheckService } from '../../services/timezone-check.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-timezone-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tzService.showBanner()) {
      <div
        class="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-300 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <div class="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <p class="font-['DM_Sans',sans-serif] text-sm text-amber-900">
            Your device timezone is
            <span class="font-semibold">{{ tzService.browserTimezone() }}</span>
            but your account is set to
            <span class="font-semibold">{{ tzService.profileTimezone() }}</span>.
          </p>
          <div class="flex items-center gap-2">
            <button
              (click)="onUpdate()"
              [disabled]="isUpdating()"
              class="px-3 py-1.5 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              [attr.aria-busy]="isUpdating()"
            >
              @if (isUpdating()) {
                Updating...
              } @else {
                Update to {{ tzService.browserTimezone() }}
              }
            </button>
            <button
              (click)="onDismiss()"
              class="px-3 py-1.5 text-sm font-semibold rounded-lg text-amber-800 hover:bg-amber-100 transition-colors"
              aria-label="Dismiss timezone mismatch banner"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TimezoneBanner {
  readonly tzService = inject(TimezoneCheckService);
  private toast = inject(ToastService);

  isUpdating = signal(false);

  onUpdate(): void {
    this.isUpdating.set(true);
    const obs = this.tzService.updateToDetectedTimezone();
    if (!obs) {
      this.isUpdating.set(false);
      return;
    }

    obs.subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.tzService.finishUpdate();
        this.tzService.dismiss();
        this.toast.success('Timezone updated successfully');
      },
      error: (err: Error) => {
        this.isUpdating.set(false);
        this.tzService.finishUpdate();
        this.toast.error(err.message || 'Failed to update timezone. Please try again.');
      },
    });
  }

  onDismiss(): void {
    this.tzService.dismiss();
  }
}
