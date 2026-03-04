import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * HTTP interceptor that adds the authentication token to API requests.
 *
 * For requests whose URL includes `/api/v1/`, clones the request and sets
 * the `Authorization: Token {token}` header when a token is available.
 * Requests without a token or to non-API URLs are passed through unchanged.
 *
 * @param req - Outgoing HTTP request
 * @param next - Next handler in the interceptor chain
 * @returns Observable of the HTTP event stream (response or error)
 *
 * @example
 * Registered in app.config.ts: provideHttpClient(withInterceptors([authInterceptor]))
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Only add token if request is to API endpoints and token exists
  if (token && req.url.includes('/api/v1/')) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};
