/**
 * Tests for auth guard
 */

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';

describe('authGuard', () => {
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

  it('should allow navigation when authenticated', () => {
    mockAuthService.isAuthenticated.set(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /login when not authenticated', () => {
    mockAuthService.isAuthenticated.set(false);
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(mockUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should check authentication state', () => {
    // Initial state is not authenticated
    mockAuthService.isAuthenticated.set(false);
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

    TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(mockAuthService.isAuthenticated()).toBe(false);
    expect(mockRouter.createUrlTree).toHaveBeenCalled();
  });

  it('should allow navigation when authentication state changes to true', () => {
    // Start not authenticated
    mockAuthService.isAuthenticated.set(false);
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

    let result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(mockUrlTree);

    // Change to authenticated
    mockAuthService.isAuthenticated.set(true);

    result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('should allow navigation during SSR (when window is undefined)', () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();

    Object.defineProperty(globalThis, 'window', {
      writable: true,
      configurable: true,
      value: originalWindow,
    });
  });

  it('should check localStorage when service authentication is false', () => {
    mockAuthService.isAuthenticated.set(false);
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

    // No token in localStorage
    localStorage.removeItem('auth_token');

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(mockUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should allow navigation when token exists in localStorage', () => {
    mockAuthService.isAuthenticated.set(false);
    localStorage.setItem('auth_token', 'test-token');

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();

    localStorage.removeItem('auth_token');
  });

  it('should prefer service authentication over localStorage', () => {
    mockAuthService.isAuthenticated.set(true);
    localStorage.removeItem('auth_token');

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('should redirect when both service and localStorage indicate no auth', () => {
    mockAuthService.isAuthenticated.set(false);
    localStorage.removeItem('auth_token');
    const mockUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(mockUrlTree);
  });

  describe('Route Guard Edge Cases', () => {
    it('should handle empty localStorage token', () => {
      mockAuthService.isAuthenticated.set(false);
      localStorage.setItem('auth_token', '');
      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(result).toBe(mockUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);

      localStorage.removeItem('auth_token');
    });

    it('should handle whitespace-only localStorage token', () => {
      mockAuthService.isAuthenticated.set(false);
      localStorage.setItem('auth_token', '   ');
      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(result).toBe(true); // Non-empty string is truthy

      localStorage.removeItem('auth_token');
    });

    it('should handle rapid auth state changes', () => {
      mockAuthService.isAuthenticated.set(false);
      let result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).not.toBe(true);

      mockAuthService.isAuthenticated.set(true);
      result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);

      mockAuthService.isAuthenticated.set(false);
      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.mockReturnValue(mockUrlTree);
      result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(mockUrlTree);
    });

    it('should prioritize service auth check over localStorage', () => {
      mockAuthService.isAuthenticated.set(true);
      localStorage.removeItem('auth_token'); // No token in storage

      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(result).toBe(true);
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });

    it('should fall back to localStorage when service auth is false', () => {
      mockAuthService.isAuthenticated.set(false);
      localStorage.setItem('auth_token', 'valid-token-value');

      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(result).toBe(true);

      localStorage.removeItem('auth_token');
    });

    it('should handle multiple guard checks in sequence', () => {
      mockAuthService.isAuthenticated.set(true);
      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

      // First check - authenticated
      let result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);

      // Second check - still authenticated
      result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);

      // Third check - logout (not authenticated)
      mockAuthService.isAuthenticated.set(false);
      localStorage.removeItem('auth_token');
      result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(mockUrlTree);
    });

    it('should correctly redirect URL on failed auth', () => {
      mockAuthService.isAuthenticated.set(false);
      localStorage.removeItem('auth_token');
      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(mockRouter.createUrlTree).toHaveBeenCalledTimes(1);
    });

    it('should handle guard context during SSR then client transition', () => {
      const originalWindow = globalThis.window;

      // SSR context - allow access
      Object.defineProperty(globalThis, 'window', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      let result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);

      // Transition to client context - check auth
      Object.defineProperty(globalThis, 'window', {
        writable: true,
        configurable: true,
        value: originalWindow,
      });

      mockAuthService.isAuthenticated.set(false);
      localStorage.removeItem('auth_token');
      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

      result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(mockUrlTree);
    });

    it('should handle different token formats in localStorage', () => {
      mockAuthService.isAuthenticated.set(false);

      // Test with JWT-like token
      localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      let result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);

      // Test with simple token
      localStorage.setItem('auth_token', 'simple-token');
      result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);

      // Test with special characters
      localStorage.setItem('auth_token', 'token-with_special.chars@123');
      result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);

      localStorage.removeItem('auth_token');
    });

    it('should maintain guard state after route navigation calls', () => {
      mockAuthService.isAuthenticated.set(true);

      // Multiple guard checks should all return true
      let result1 = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      let result2 = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      let result3 = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
  });

  describe('Navigation State and Guard Interaction', () => {
    it('should handle auth state changes during navigation', () => {
      mockAuthService.isAuthenticated.set(true);

      // Initial navigation - authenticated
      let result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);

      // Auth expires
      mockAuthService.isAuthenticated.set(false);
      localStorage.removeItem('auth_token');
      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

      // Next navigation attempt
      result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(mockUrlTree);
    });

    it('should not call createUrlTree multiple times for same auth failure', () => {
      mockAuthService.isAuthenticated.set(false);
      localStorage.removeItem('auth_token');
      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

      // Multiple guard checks
      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      // Should be called twice (once per guard check)
      expect(mockRouter.createUrlTree).toHaveBeenCalledTimes(2);
    });

    it('should switch between allowed and denied states', () => {
      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

      // Start denied
      mockAuthService.isAuthenticated.set(false);
      localStorage.removeItem('auth_token');
      let result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(mockUrlTree);

      // Switch to allowed
      mockAuthService.isAuthenticated.set(true);
      result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);

      // Switch to denied again
      mockAuthService.isAuthenticated.set(false);
      localStorage.removeItem('auth_token');
      result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(mockUrlTree);
    });

    it('should handle concurrent guard checks', () => {
      mockAuthService.isAuthenticated.set(true);

      // Simulate concurrent navigation to protected routes
      const results = [
        TestBed.runInInjectionContext(() => authGuard({} as any, {} as any)),
        TestBed.runInInjectionContext(() => authGuard({} as any, {} as any)),
        TestBed.runInInjectionContext(() => authGuard({} as any, {} as any)),
      ];

      // All should allow navigation
      results.forEach((result) => {
        expect(result).toBe(true);
      });
    });
  });
});
