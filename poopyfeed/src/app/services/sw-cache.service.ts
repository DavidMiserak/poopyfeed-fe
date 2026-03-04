import { isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';

/**
 * Service worker cache eviction for API list responses.
 *
 * Evicts Cache API entries for child-scoped list endpoints so that after
 * creating/updating/deleting tracking data, the next list fetch gets fresh data.
 * No-op during SSR or when Cache API is unavailable.
 */
@Injectable({
  providedIn: 'root',
})
export class SwCacheService {
  private platformId = inject(PLATFORM_ID);

  /**
   * Evict readonly list caches for a child so new logs refresh immediately.
   *
   * Clears cache entries for children list, feedings, diapers, naps, and
   * timeline for the given child.
   *
   * @param childId - Child ID whose list caches to evict
   */
  evictReadonlyListCaches(childId: number): void {
    if (!isPlatformBrowser(this.platformId) || !('caches' in window)) {
      return;
    }

    const prefixes = [
      '/api/v1/children/',
      `/api/v1/children/${childId}/feedings/`,
      `/api/v1/children/${childId}/diapers/`,
      `/api/v1/children/${childId}/naps/`,
      `/api/v1/analytics/children/${childId}/timeline/`,
    ];

    void this.evictByPrefixes(prefixes);
  }

  private async evictByPrefixes(prefixes: string[]): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          await Promise.all(
            requests.map((request) => {
              try {
                const url = new URL(request.url);
                if (prefixes.some((prefix) => url.pathname.startsWith(prefix))) {
                  return cache.delete(request);
                }
              } catch {
                // Ignore malformed URLs.
              }
              return Promise.resolve(false);
            })
          );
        })
      );
    } catch {
      // Cache API may be unavailable or blocked; ignore.
    }
  }
}
