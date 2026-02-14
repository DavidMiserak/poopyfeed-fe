/**
 * Tests for public-only guard
 */

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { publicOnlyGuard } from './public-only.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('publicOnlyGuard', () => {
  let mockAuthService: { isAuthenticated: ReturnType<typeof signal<boolean>> };
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: signal(false),
    };

    mockRouter = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should allow access when not authenticated (via service)', () => {
    mockAuthService.isAuthenticated.set(false);
    localStorage.removeItem('auth_token');

    const result = TestBed.runInInjectionContext(() => publicOnlyGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /children when authenticated (via service signal)', () => {
    mockAuthService.isAuthenticated.set(true);
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);
    localStorage.removeItem('auth_token');

    const result = TestBed.runInInjectionContext(() => publicOnlyGuard({} as any, {} as any));

    expect(result).toBe(mockUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/children']);
  });

  it('should redirect to /children when authenticated (via localStorage)', () => {
    mockAuthService.isAuthenticated.set(false);
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);
    localStorage.setItem('auth_token', 'test-token');

    const result = TestBed.runInInjectionContext(() => publicOnlyGuard({} as any, {} as any));

    expect(result).toBe(mockUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/children']);
    localStorage.removeItem('auth_token');
  });

  it('should allow access on server-side (SSR)', () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const result = TestBed.runInInjectionContext(() => publicOnlyGuard({} as any, {} as any));

    Object.defineProperty(globalThis, 'window', {
      writable: true,
      configurable: true,
      value: originalWindow,
    });
    expect(result).toBe(true);
  });

  it('should prefer service authentication over localStorage', () => {
    mockAuthService.isAuthenticated.set(true);
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);
    localStorage.removeItem('auth_token');

    const result = TestBed.runInInjectionContext(() => publicOnlyGuard({} as any, {} as any));

    expect(result).toBe(mockUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/children']);
  });

  it('should ignore empty string token in localStorage', () => {
    mockAuthService.isAuthenticated.set(false);
    localStorage.setItem('auth_token', '');

    const result = TestBed.runInInjectionContext(() => publicOnlyGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect when whitespace-only token in localStorage (truthy value)', () => {
    mockAuthService.isAuthenticated.set(false);
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);
    localStorage.setItem('auth_token', '   ');

    const result = TestBed.runInInjectionContext(() => publicOnlyGuard({} as any, {} as any));

    // Whitespace is truthy, so should redirect
    expect(result).toBe(mockUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/children']);
  });

  it('should redirect when localStorage has valid token but service is not authenticated', () => {
    mockAuthService.isAuthenticated.set(false);
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);
    localStorage.setItem('auth_token', 'valid-token');

    const result = TestBed.runInInjectionContext(() => publicOnlyGuard({} as any, {} as any));

    expect(result).toBe(mockUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/children']);
  });

  it('should handle rapid sequential guard checks with state changes', () => {
    mockAuthService.isAuthenticated.set(false);
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

    // First check - unauthenticated
    let result = TestBed.runInInjectionContext(() => publicOnlyGuard({} as any, {} as any));
    expect(result).toBe(true);

    // Change auth state
    mockAuthService.isAuthenticated.set(true);
    vi.clearAllMocks();
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

    // Second check - now authenticated
    result = TestBed.runInInjectionContext(() => publicOnlyGuard({} as any, {} as any));
    expect(result).toBe(mockUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/children']);
  });
});
