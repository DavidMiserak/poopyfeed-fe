import { ChangeDetectionStrategy, Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-update-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (updateAvailable()) {
      <div
        class="fixed bottom-4 left-4 right-4 z-[998] mx-auto max-w-md rounded-lg border border-blue-300 bg-blue-50 p-4 shadow-lg"
        role="alert"
        aria-live="polite"
      >
        <div class="flex items-center gap-3">
          <span class="text-xl" aria-hidden="true">🔄</span>
          <p class="flex-1 text-sm font-medium text-blue-900">A new version is available.</p>
          <button
            (click)="reload()"
            class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Update
          </button>
          <button
            (click)="dismiss()"
            class="text-blue-600 hover:text-blue-800 focus:outline-none"
            aria-label="Dismiss update notification"
          >
            ✕
          </button>
        </div>
      </div>
    }
  `,
})
export class UpdateBanner {
  private swUpdate = inject(SwUpdate);
  private platformId = inject(PLATFORM_ID);

  protected updateAvailable = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId) || !this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => this.updateAvailable.set(true));
  }

  protected reload(): void {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }

  protected dismiss(): void {
    this.updateAvailable.set(false);
  }
}
