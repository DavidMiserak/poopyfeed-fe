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

TestBed.initTestEnvironment([], platformBrowserTesting());
