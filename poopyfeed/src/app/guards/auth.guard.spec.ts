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
});
