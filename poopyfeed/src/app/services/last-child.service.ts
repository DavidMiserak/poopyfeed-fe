import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const STORAGE_KEY = 'last-child-id';

/**
 * Service that tracks the last visited child ID from the URL.
 *
 * Persists to localStorage so quick-log and redirects can open the most
 * recently viewed child. Listens to Router NavigationEnd and updates when
 * URL matches /children/:id/.
 */
@Injectable({
  providedIn: 'root',
})
export class LastChildService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private lastChildId = signal<number | null>(null);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const storedId = this.readStoredId();
    if (storedId) {
      this.lastChildId.set(storedId);
    }

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        const childId = this.extractChildId(this.router.url);
        if (childId) {
          this.setLastChildId(childId);
        }
      });
  }

  /**
   * Get the last visited child ID (from URL + localStorage).
   *
   * @returns Child ID or null if none stored
   */
  getLastChildId(): number | null {
    return this.lastChildId();
  }

  /**
   * Set the last child ID (e.g. after navigation); persists to localStorage.
   *
   * @param childId - Child ID to remember
   */
  setLastChildId(childId: number): void {
    this.lastChildId.set(childId);
    try {
      localStorage.setItem(STORAGE_KEY, String(childId));
    } catch {
      // localStorage may be unavailable (private browsing)
    }
  }

  /**
   * Clear the stored last child ID (memory and localStorage).
   */
  clear(): void {
    this.lastChildId.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }

  private readStoredId(): number | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = Number(stored);
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private extractChildId(url: string): number | null {
    const match = url.match(/\/children\/(\d+)(?:\/|$)/);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
