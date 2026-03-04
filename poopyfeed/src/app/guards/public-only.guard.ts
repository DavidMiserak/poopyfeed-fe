/**
 * Public-only guard to redirect authenticated users away from public routes.
 *
 * Used for /login, /signup, and landing so logged-in users go to /children.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Function-based route guard for public-only routes.
 *
 * Unauthenticated users can access the route. Authenticated users
 * (via AuthService or localStorage) are redirected to /children.
 * On the server (SSR), always allows access.
 *
 * @returns True to allow access, or UrlTree to redirect to /children
 *
 * @example
 * ```typescript
 * { path: 'login', component: Login, canActivate: [publicOnlyGuard] }
 * ```
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
