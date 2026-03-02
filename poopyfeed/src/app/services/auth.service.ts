import { Injectable, inject, signal, computed, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ErrorHandler } from './error.utils';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap } from 'rxjs';

export interface AuthResponse {
  auth_token: string;
}

export interface UserResponse {
  id: number;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  re_password?: string; // Optional, not used by allauth
}

export interface PasswordResetRequest {
  key: string;
  password: string;
}

export interface PasswordResetEmailRequest {
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly ALLAUTH_BASE = '/api/v1/browser/v1/auth';
  private readonly TOKEN_KEY = 'auth_token';

  // Reactive state
  private authToken = signal<string | null>(this.getStoredToken());
  isAuthenticated = computed(() => !!this.authToken());

  constructor() {
    // Re-initialize token from localStorage after SSR hydration on client
    afterNextRender(() => {
      const token = this.getStoredToken();
      if (token && !this.authToken()) {
        this.authToken.set(token);
      }
    });
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<{status: number; data: {user: unknown}}>(`${this.ALLAUTH_BASE}/login`, credentials, {
        withCredentials: true
      })
      .pipe(
        switchMap(() => {
          // After allauth login, get the auth token
          return this.http.post<AuthResponse>(`${this.ALLAUTH_BASE}/token/`, {}, {
            withCredentials: true
          });
        }),
        tap((response) => {
          this.setToken(response.auth_token);
        }),
        catchError((error) => {
          return throwError(() => ErrorHandler.handle(error, 'Login'));
        })
      );
  }

  /**
   * Request a password reset email via django-allauth headless API
   */
  requestPasswordReset(data: PasswordResetEmailRequest): Observable<void> {
    return this.http
      .post<void>(`${this.ALLAUTH_BASE}/password/request`, data, {
        withCredentials: true,
      })
      .pipe(
        catchError((error) => {
          return throwError(() =>
            ErrorHandler.handle(error, 'Request password reset')
          );
        })
      );
  }

  /**
   * Reset password using a password reset key from email
   *
   * After successfully setting the new password, this will fetch a new auth token
   * so the user is logged in, matching the login/signup flow.
   */
  resetPassword(data: PasswordResetRequest): Observable<AuthResponse> {
    return this.http
      .post<{ status: number }>(
        `${this.ALLAUTH_BASE}/password/reset`,
        {
          key: data.key,
          password: data.password,
        },
        {
          withCredentials: true,
        }
      )
      .pipe(
        switchMap(() =>
          this.http.post<AuthResponse>(
            `${this.ALLAUTH_BASE}/token/`,
            {},
            {
              withCredentials: true,
            }
          )
        ),
        tap((response) => {
          this.setToken(response.auth_token);
        }),
        catchError((error) => {
          return throwError(() =>
            ErrorHandler.handle(error, 'Reset password')
          );
        })
      );
  }

  /**
   * Register a new user
   */
  signup(data: SignupRequest): Observable<UserResponse> {
    // Remove re_password for allauth (it doesn't require confirmation)
    const { email, password } = data;
    return this.http.post<{status: number; data: {user: UserResponse}}>(`${this.ALLAUTH_BASE}/signup`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      switchMap((response) => {
        // After allauth signup, get the auth token
        return this.http.post<AuthResponse>(`${this.ALLAUTH_BASE}/token/`, {}, {
          withCredentials: true
        }).pipe(
          tap((tokenResponse) => {
            this.setToken(tokenResponse.auth_token);
          }),
          switchMap(() => {
            // Return the user data
            return [response.data.user];
          })
        );
      }),
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Signup'));
      })
    );
  }

  /**
   * Logout the current user
   */
  logout(): Observable<void> {
    return this.http.delete<void>(`${this.ALLAUTH_BASE}/session`, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.clearToken();
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        // Clear token even if logout fails
        this.clearToken();
        this.router.navigate(['/login']);
        return throwError(() => ErrorHandler.handle(error, 'Logout'));
      })
    );
  }

  /**
   * Get the current auth token
   */
  getToken(): string | null {
    return this.authToken();
  }

  /**
   * Replace the stored token (e.g. after password change rotates the token)
   */
  updateToken(newToken: string): void {
    this.setToken(newToken);
  }

  /**
   * Clear auth state and redirect (e.g. after account deletion)
   */
  clearAuthAndRedirect(path: string): void {
    this.clearToken();
    this.router.navigate([path]);
  }

  /**
   * Set the auth token in memory and localStorage
   */
  private setToken(token: string): void {
    const previousToken = this.authToken();
    this.authToken.set(token);
    localStorage.setItem(this.TOKEN_KEY, token);
    if (previousToken && previousToken !== token) {
      this.clearServiceWorkerCaches();
    }
  }

  /**
   * Clear the auth token from memory and localStorage
   */
  private clearToken(): void {
    const hadToken = this.authToken();
    this.authToken.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    if (hadToken) {
      this.clearServiceWorkerCaches();
    }
  }

  /**
   * Get stored token from localStorage
   */
  private getStoredToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private clearServiceWorkerCaches(): void {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    void caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => undefined);
  }
}
