import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_BASE = '/api/v1/auth';
  private readonly ALLAUTH_BASE = '/api/v1/auth/browser/v1/auth';
  private readonly TOKEN_KEY = 'auth_token';

  // Reactive state
  private authToken = signal<string | null>(this.getStoredToken());
  isAuthenticated = computed(() => !!this.authToken());

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
          return this.http.get<AuthResponse>(`${this.API_BASE}/token/`, {
            withCredentials: true
          });
        }),
        tap((response) => {
          this.setToken(response.auth_token);
        }),
        catchError((error) => {
          return throwError(() => this.handleError(error));
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
        return this.http.get<AuthResponse>(`${this.API_BASE}/token/`, {
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
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Logout the current user
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.ALLAUTH_BASE}/logout`, {}, {
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
        return throwError(() => this.handleError(error));
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
   * Set the auth token in memory and localStorage
   */
  private setToken(token: string): void {
    this.authToken.set(token);
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Clear the auth token from memory and localStorage
   */
  private clearToken(): void {
    this.authToken.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
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

  /**
   * Handle HTTP errors and return user-friendly messages
   */
  private handleError(error: unknown): Error {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as { error: Record<string, unknown>; status?: number };

      // Handle different error response formats from Django
      if (httpError.error && typeof httpError.error === 'object') {
        const errorObj = httpError.error as Record<string, unknown>;

        // Handle field-specific errors (e.g., {"email": ["This field is required"]})
        const firstKey = Object.keys(errorObj)[0];
        if (firstKey && Array.isArray(errorObj[firstKey])) {
          const messages = errorObj[firstKey] as string[];
          return new Error(`${firstKey}: ${messages.join(', ')}`);
        }

        // Handle non_field_errors or detail
        if ('non_field_errors' in errorObj && Array.isArray(errorObj['non_field_errors'])) {
          return new Error((errorObj['non_field_errors'] as string[]).join(', '));
        }
        if ('detail' in errorObj && typeof errorObj['detail'] === 'string') {
          return new Error(errorObj['detail'] as string);
        }
      }

      // Handle HTTP status codes
      if (httpError.status === 401) {
        return new Error('Invalid email or password');
      }
      if (httpError.status === 400) {
        return new Error('Invalid request. Please check your input.');
      }
      if (httpError.status === 409) {
        return new Error('An account with this email already exists.');
      }
      if (httpError.status === 500) {
        return new Error('Server error. Please try again later.');
      }
    }

    return new Error('An unexpected error occurred. Please try again.');
  }
}
