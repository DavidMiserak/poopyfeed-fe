import { Injectable, inject, signal, computed, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ErrorHandler } from './error.utils';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap } from 'rxjs';

/** Response from token/login endpoint; contains auth token. */
export interface AuthResponse {
  auth_token: string;
}

/** User data returned after signup. */
export interface UserResponse {
  id: number;
  email: string;
}

/** Payload for login request. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Payload for signup request. */
export interface SignupRequest {
  email: string;
  password: string;
  /** Optional; not used by django-allauth headless API */
  re_password?: string;
}

/** Payload for password reset (key from email link + new password). */
export interface PasswordResetRequest {
  key: string;
  password: string;
}

/** Payload for requesting a password reset email. */
export interface PasswordResetEmailRequest {
  email: string;
}

/**
 * Authentication service for login, signup, logout, and token management.
 *
 * Uses django-allauth headless API at /api/v1/browser/v1/auth. Token is stored
 * in memory (signal) and localStorage; auth state is exposed via isAuthenticated.
 * SSR-safe: token is read from localStorage only after client hydration.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly ALLAUTH_BASE = '/api/v1/browser/v1/auth';
  private readonly TOKEN_KEY = 'auth_token';

  /** Reactive: true if auth token is present. */
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
   * Login with email and password; stores token on success.
   *
   * @param credentials - Email and password
   * @returns Observable of auth response (auth_token)
   * @throws ApiError via throwError on failure (e.g. invalid credentials)
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
   * Request a password reset email (django-allauth headless API).
   *
   * @param data - Object with user email
   * @returns Observable that completes on success
   * @throws ApiError on failure (e.g. email not found)
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
   * Reset password using key from email link; fetches new token so user is logged in.
   *
   * @param data - Key (from email) and new password
   * @returns Observable of auth response (auth_token); token is stored
   * @throws ApiError on invalid key or validation failure
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
   * Register a new user; stores token and returns user data.
   *
   * @param data - Email and password
   * @returns Observable of user data (id, email); token is stored
   * @throws ApiError on validation failure or duplicate email
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
   * Logout: clear token, invalidate session, redirect to /login.
   *
   * @returns Observable that completes on success; token is always cleared
   * @throws ApiError if server request fails (token still cleared)
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
   * Get the current auth token from memory.
   *
   * @returns Token string or null if not authenticated
   */
  getToken(): string | null {
    return this.authToken();
  }

  /**
   * Replace the stored token (e.g. after password change).
   *
   * @param newToken - New auth token to store
   */
  updateToken(newToken: string): void {
    this.setToken(newToken);
  }

  /**
   * Clear auth state and navigate to the given path (e.g. after account deletion).
   *
   * @param path - Route path to navigate to (e.g. '/login')
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
