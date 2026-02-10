import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  UserProfile,
  UserProfileUpdate,
  ChangePasswordRequest,
  ChangePasswordResponse,
  DeleteAccountRequest,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/account';

  profile = signal<UserProfile | null>(null);

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_BASE}/profile/`).pipe(
      tap((profile) => this.profile.set(profile)),
      catchError((error) => throwError(() => this.handleError(error)))
    );
  }

  updateProfile(data: UserProfileUpdate): Observable<UserProfile> {
    return this.http
      .patch<UserProfile>(`${this.API_BASE}/profile/`, data)
      .pipe(
        tap((profile) => this.profile.set(profile)),
        catchError((error) => throwError(() => this.handleError(error)))
      );
  }

  changePassword(
    data: ChangePasswordRequest
  ): Observable<ChangePasswordResponse> {
    return this.http
      .post<ChangePasswordResponse>(`${this.API_BASE}/password/`, data)
      .pipe(
        catchError((error) => throwError(() => this.handleError(error)))
      );
  }

  deleteAccount(data: DeleteAccountRequest): Observable<void> {
    return this.http
      .post<void>(`${this.API_BASE}/delete/`, data)
      .pipe(
        catchError((error) => throwError(() => this.handleError(error)))
      );
  }

  private handleError(error: unknown): Error {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as HttpErrorResponse;

      if (httpError.error && typeof httpError.error === 'object') {
        const errorObj = httpError.error as Record<string, unknown>;

        const firstKey = Object.keys(errorObj)[0];
        if (firstKey && Array.isArray(errorObj[firstKey])) {
          const messages = errorObj[firstKey] as string[];
          return new Error(`${firstKey}: ${messages.join(', ')}`);
        }

        if (
          'non_field_errors' in errorObj &&
          Array.isArray(errorObj['non_field_errors'])
        ) {
          return new Error(
            (errorObj['non_field_errors'] as string[]).join(', ')
          );
        }
        if ('detail' in errorObj && typeof errorObj['detail'] === 'string') {
          return new Error(errorObj['detail'] as string);
        }
      }

      if (httpError.status === 400) {
        return new Error('Invalid request. Please check your input.');
      }
      if (httpError.status === 401) {
        return new Error('You must be logged in to perform this action.');
      }
      if (httpError.status === 500) {
        return new Error('Server error. Please try again later.');
      }
    }

    return new Error('An unexpected error occurred. Please try again.');
  }
}
