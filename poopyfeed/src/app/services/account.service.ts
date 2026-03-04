import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ErrorHandler } from './error.utils';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  UserProfile,
  UserProfileUpdate,
  ChangePasswordRequest,
  ChangePasswordResponse,
  DeleteAccountRequest,
} from '../models/user.model';

/**
 * Account service for user profile and account operations.
 *
 * Endpoints: GET/PATCH /api/v1/account/profile/, POST password, POST delete.
 * Profile is cached in the profile signal; auth guard loads it for timezone.
 */
@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/account';

  /** Cached user profile (null until getProfile() is called). */
  profile = signal<UserProfile | null>(null);

  /**
   * Fetch current user profile; updates profile signal.
   *
   * @returns Observable of user profile
   * @throws ApiError on failure (e.g. 401)
   */
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_BASE}/profile/`).pipe(
      tap((profile) => this.profile.set(profile)),
      catchError((error) => throwError(() => ErrorHandler.handle(error, 'Get')))
    );
  }

  /**
   * Update user profile (name, email, timezone); updates profile signal.
   *
   * @param data - Fields to update (partial)
   * @returns Observable of updated profile
   * @throws ApiError on validation failure
   */
  updateProfile(data: UserProfileUpdate): Observable<UserProfile> {
    return this.http
      .patch<UserProfile>(`${this.API_BASE}/profile/`, data)
      .pipe(
        tap((profile) => this.profile.set(profile)),
        catchError((error) => throwError(() => ErrorHandler.handle(error, 'Update')))
      );
  }

  /**
   * Change password; returns new auth token (call AuthService.updateToken).
   *
   * @param data - Current password and new password + confirmation
   * @returns Observable of detail and new auth_token
   * @throws ApiError on wrong current password or validation failure
   */
  changePassword(
    data: ChangePasswordRequest
  ): Observable<ChangePasswordResponse> {
    return this.http
      .post<ChangePasswordResponse>(`${this.API_BASE}/password/`, data)
      .pipe(
        catchError((error) => throwError(() => ErrorHandler.handle(error, 'Update')))
      );
  }

  /**
   * Delete account (requires current password).
   *
   * @param data - Current password for verification
   * @returns Observable that completes on success
   * @throws ApiError on wrong password or failure
   */
  deleteAccount(data: DeleteAccountRequest): Observable<void> {
    return this.http
      .post<void>(`${this.API_BASE}/delete/`, data)
      .pipe(
        catchError((error) => throwError(() => ErrorHandler.handle(error, 'Delete')))
      );
  }
}
