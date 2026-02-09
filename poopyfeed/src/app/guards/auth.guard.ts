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

  // On server-side (SSR): Always allow access, client will handle auth check
  if (typeof window === 'undefined') {
    return true;
  }

  // Client-side checks
  // Check if authenticated via service (works after login)
  if (authService.isAuthenticated()) {
    return true;
  }

  // Check localStorage directly (handles page refresh)
  const token = localStorage.getItem('auth_token');
  if (token) {
    return true;
  }

  // No authentication found - redirect to login
  return router.createUrlTree(['/login']);
};
