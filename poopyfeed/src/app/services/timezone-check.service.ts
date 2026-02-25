/**
 * Detects mismatches between the user's profile timezone preference
 * and the browser's actual timezone. Offers session-scoped dismissal
 * so users aren't repeatedly prompted.
 */

import { computed, inject, Injectable, signal } from '@angular/core';
import { AccountService } from './account.service';
import { DateTimeService } from './datetime.service';

const SESSION_KEY = 'tz-banner-dismissed';

@Injectable({
  providedIn: 'root',
})
export class TimezoneCheckService {
  private accountService = inject(AccountService);

  private dismissed = signal(this.wasDismissedThisSession());
  private updating = signal(false);

  readonly browserTimezone = signal<string | null>(
    DateTimeService.getBrowserTimezone()
  );

  /**
   * True when the browser timezone differs from the user's saved preference
   * and the banner has not been dismissed this session.
   */
  readonly showBanner = computed(() => {
    if (this.dismissed()) return false;
    if (this.updating()) return false;

    const profile = this.accountService.profile();
    if (!profile) return false;

    const browserTz = this.browserTimezone();
    if (!browserTz) return false;

    return profile.timezone !== browserTz;
  });

  readonly profileTimezone = computed(
    () => this.accountService.profile()?.timezone ?? 'UTC'
  );

  dismiss(): void {
    this.dismissed.set(true);
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {
      // sessionStorage may be unavailable (private browsing, SSR)
    }
  }

  /**
   * Update the user's profile timezone to match the browser.
   * Returns an observable the caller can subscribe to for toast feedback.
   */
  updateToDetectedTimezone() {
    const browserTz = this.browserTimezone();
    if (!browserTz) return;

    this.updating.set(true);
    return this.accountService.updateProfile({ timezone: browserTz });
  }

  /** Mark updating as complete (called after subscribe completes). */
  finishUpdate(): void {
    this.updating.set(false);
  }

  private wasDismissedThisSession(): boolean {
    if (typeof window === 'undefined') return true; // SSR — don't show
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
