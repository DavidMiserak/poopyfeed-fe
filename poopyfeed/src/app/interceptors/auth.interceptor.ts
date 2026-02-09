import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor that adds the authentication token to all requests
 * that go to the API endpoints (/api/v1/)
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
