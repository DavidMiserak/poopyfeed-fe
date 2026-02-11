/**
 * Public-only guard to redirect authenticated users away from public routes
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Function-based route guard that redirects authenticated users away from public routes.
 * Unauthenticated users can access the route normally.
 * Authenticated users are redirected to /children.
 *
 * Note: Checks localStorage directly to handle SSR hydration correctly.
 */
export const publicOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // On server-side (SSR): Always allow access, client will handle auth check
  if (typeof window === 'undefined') {
    return true;
  }

  // Client-side checks
  // Check if authenticated via service (works after login)
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/children']);
  }

  // Check localStorage directly (handles page refresh)
  const token = localStorage.getItem('auth_token');
  if (token) {
    return router.createUrlTree(['/children']);
  }

  // No authentication found - allow access to public route
  return true;
};
