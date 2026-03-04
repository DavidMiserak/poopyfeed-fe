/**
 * Auth guard to protect routes requiring authentication.
 *
 * Redirects unauthenticated users to /login. On the server (SSR), always
 * allows access so the client can validate after hydration.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';

/**
 * Function-based route guard that checks if the user is authenticated.
 *
 * Redirects to /login if not authenticated. When authenticated, ensures
 * user profile (including timezone) is loaded before allowing access, so
 * DateTimeService displays times in the user's timezone.
 *
 * @returns True to allow access, or UrlTree to redirect to /login; during
 *   profile load returns Observable<boolean>
 * @see AuthService
 * @see AccountService
 *
 * @example
 * ```typescript
 * { path: 'children', component: ChildrenList, canActivate: [authGuard] }
 * ```
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const accountService = inject(AccountService);
  const router = inject(Router);

  // On server-side (SSR): Always allow access, client will handle auth check
  if (typeof window === 'undefined') {
    return true;
  }

  // Client-side: not authenticated
  const isAuthenticated =
    authService.isAuthenticated() || !!localStorage.getItem('auth_token');
  if (!isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  // Load profile once so timezone is available for all date/time display
  if (!accountService.profile()) {
    return accountService.getProfile().pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  return true;
};
