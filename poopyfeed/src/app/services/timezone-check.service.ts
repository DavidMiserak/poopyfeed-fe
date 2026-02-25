/**
 * Detects mismatches between the user's profile timezone preference
 * and the browser's actual timezone. Re-checks on every navigation.
 * Offers session-scoped dismissal so users aren't repeatedly prompted.
 */

import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AccountService } from './account.service';
import { DateTimeService } from './datetime.service';

const SESSION_KEY = 'tz-banner-dismissed';

@Injectable({
  providedIn: 'root',
})
export class TimezoneCheckService {
  private accountService = inject(AccountService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

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

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.refreshBrowserTimezone());
  }

  dismiss(): void {
    this.dismissed.set(true);
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {
      // sessionStorage may be unavailable (private browsing, SSR)
    }
  }

  /**
   * Clear the session dismissal so the banner can reappear.
   * Called when the user manually changes their timezone in account settings.
   */
  clearDismissal(): void {
    this.dismissed.set(false);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // sessionStorage may be unavailable
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

  private refreshBrowserTimezone(): void {
    const tz = DateTimeService.getBrowserTimezone();
    if (tz) {
      this.browserTimezone.set(tz);
    }
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
