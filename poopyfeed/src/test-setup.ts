/**
 * Vitest setup file for Angular tests.
 *
 * When running tests via Vitest directly (npx vitest run), we must initialize
 * the Angular test environment so TestBed works. The Angular test builder
 * (ng test) does this via its generated setup; this file ensures the same
 * when using Vitest.
 *
 * For async operations in tests, use:
 *   await fixture.whenStable()
 * or fakeAsync() + flush() when you need to drain the zone before teardown.
 */
import { TestBed } from '@angular/core/testing';
import { platformBrowserTesting } from '@angular/platform-browser/testing';

// jsdom does not provide IntersectionObserver; Angular @defer (on viewport) needs it.
// Mock that immediately reports elements as intersecting so deferred blocks load in tests.
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [0];

  constructor(
    private callback: IntersectionObserverCallback,
    private _options?: IntersectionObserverInit
  ) {}

  observe(_target: Element): void {
    // Run asynchronously so Angular's defer trigger behaves like in browser
    queueMicrotask(() => {
      this.callback(
        [{ isIntersecting: true, intersectionRatio: 1, target: _target, boundingClientRect: {} as DOMRectReadOnly, intersectionRect: {} as DOMRectReadOnly, rootBounds: null, time: 0 }],
        this
      );
    });
  }

  unobserve(_target: Element): void {
    // Mock: no-op (tests do not need to unobserve)
  }

  disconnect(): void {
    // Mock: no-op (tests do not need to disconnect)
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

// When using `ng test`, init-testbed.js already calls initTestEnvironment; avoid double init.
try {
  TestBed.initTestEnvironment([], platformBrowserTesting());
} catch {
  // Already initialized (e.g. by Angular's init-testbed.js).
}
