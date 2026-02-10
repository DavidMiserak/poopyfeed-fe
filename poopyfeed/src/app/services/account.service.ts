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
      catchError((error) => throwError(() => ErrorHandler.handle(error, 'Get')))
    );
  }

  updateProfile(data: UserProfileUpdate): Observable<UserProfile> {
    return this.http
      .patch<UserProfile>(`${this.API_BASE}/profile/`, data)
      .pipe(
        tap((profile) => this.profile.set(profile)),
        catchError((error) => throwError(() => ErrorHandler.handle(error, 'Update')))
      );
  }

  changePassword(
    data: ChangePasswordRequest
  ): Observable<ChangePasswordResponse> {
    return this.http
      .post<ChangePasswordResponse>(`${this.API_BASE}/password/`, data)
      .pipe(
        catchError((error) => throwError(() => ErrorHandler.handle(error, 'Update')))
      );
  }

  deleteAccount(data: DeleteAccountRequest): Observable<void> {
    return this.http
      .post<void>(`${this.API_BASE}/delete/`, data)
      .pipe(
        catchError((error) => throwError(() => ErrorHandler.handle(error, 'Delete')))
      );
  }
}
