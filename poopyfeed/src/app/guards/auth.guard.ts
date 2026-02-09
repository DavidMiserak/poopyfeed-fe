/**
 * Auth guard to protect routes requiring authentication
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Function-based route guard that checks if the user is authenticated.
 * Redirects to /login if not authenticated.
 *
 * Note: Checks localStorage directly to handle SSR hydration correctly.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[AuthGuard] Running auth guard');
  console.log('[AuthGuard] isAuthenticated:', authService.isAuthenticated());
  console.log('[AuthGuard] Running on:', typeof window === 'undefined' ? 'server' : 'client');

  // On server-side (SSR): Always allow access, client will handle auth check
  if (typeof window === 'undefined') {
    console.log('[AuthGuard] Running on server (SSR) - allowing access');
    return true;
  }

  // Client-side checks
  // Check if authenticated via service (works after login)
  if (authService.isAuthenticated()) {
    console.log('[AuthGuard] Authenticated via service - allowing access');
    return true;
  }

  // Check localStorage directly (handles page refresh)
  const token = localStorage.getItem('auth_token');
  console.log('[AuthGuard] Checking localStorage, token exists:', !!token);
  if (token) {
    console.log('[AuthGuard] Token found in localStorage - allowing access');
    return true;
  }

  // No authentication found - redirect to login
  console.log('[AuthGuard] No authentication found - redirecting to login');
  return router.createUrlTree(['/login']);
};
