import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GaTrackingService } from '../../services/ga-tracking.service';

@Component({
  selector: 'app-cookie-consent-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div
        class="fixed inset-x-0 bottom-0 z-50 border-t border-stone-300 bg-white px-4 py-4 shadow-lg"
        role="dialog"
        aria-label="Cookie consent"
      >
        <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <p class="font-['DM_Sans',sans-serif] text-sm text-stone-700">
            We use cookies to understand how you use PoopyFeed so we can improve the experience.
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              (click)="decline()"
              class="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
            >
              Decline
            </button>
            <button
              type="button"
              (click)="accept()"
              class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CookieConsentBanner {
  private ga = inject(GaTrackingService);
  visible = signal(this.shouldShow());

  accept(): void {
    this.ga.enableTracking();
    this.visible.set(false);
  }

  decline(): void {
    this.ga.disableTracking();
    this.visible.set(false);
  }

  private shouldShow(): boolean {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('analytics_consent');
  }
}
