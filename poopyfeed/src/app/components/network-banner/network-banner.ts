import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NetworkStatusService } from '../../services/network-status.service';

@Component({
  selector: 'app-network-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!networkStatus.isOnline()) {
      <div
        class="w-full border-b-2 border-rose-300 bg-rose-50 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <span
            class="rounded-full bg-rose-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-rose-900"
          >
            Offline
          </span>
          <p class="font-['DM_Sans',sans-serif] text-sm text-rose-900">
            You're offline. Data may be stale and saves may fail until you're back online.
          </p>
        </div>
      </div>
    }
  `,
})
export class NetworkBanner {
  protected networkStatus = inject(NetworkStatusService);
}
