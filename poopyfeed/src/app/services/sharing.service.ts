/**
 * Service for managing child sharing and invites via the PoopyFeed API
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  ChildShare,
  ShareInvite,
  InviteCreate,
  InviteAcceptResponse,
} from '../models/sharing.model';

@Injectable({
  providedIn: 'root',
})
export class SharingService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/children';

  // Reactive state
  shares = signal<ChildShare[]>([]);
  invites = signal<ShareInvite[]>([]);

  /**
   * List all shares for a child (existing access grants)
   */
  listShares(childId: number): Observable<ChildShare[]> {
    return this.http
      .get<ChildShare[]>(`${this.API_BASE}/${childId}/shares/`)
      .pipe(
        tap((shares) => {
          this.shares.set(shares);
        }),
        catchError((error) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Revoke a user's access to a child
   */
  revokeShare(childId: number, shareId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.API_BASE}/${childId}/shares/${shareId}/`)
      .pipe(
        tap(() => {
          // Remove from cached list
          const currentShares = this.shares();
          this.shares.set(currentShares.filter((s) => s.id !== shareId));
        }),
        catchError((error) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * List all invites for a child (pending invitations)
   */
  listInvites(childId: number): Observable<ShareInvite[]> {
    return this.http
      .get<ShareInvite[]>(`${this.API_BASE}/${childId}/invites/`)
      .pipe(
        tap((invites) => {
          this.invites.set(invites);
        }),
        catchError((error) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Create a new invite link for a child
   */
  createInvite(
    childId: number,
    data: InviteCreate
  ): Observable<ShareInvite> {
    return this.http
      .post<ShareInvite>(`${this.API_BASE}/${childId}/invites/`, data)
      .pipe(
        tap((invite) => {
          // Add to cached list
          const currentInvites = this.invites();
          this.invites.set([invite, ...currentInvites]);
        }),
        catchError((error) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Toggle an invite's active status
   */
  toggleInvite(
    childId: number,
    inviteId: number,
    isActive: boolean
  ): Observable<ShareInvite> {
    return this.http
      .patch<ShareInvite>(`${this.API_BASE}/${childId}/invites/${inviteId}/`, {
        is_active: isActive,
      })
      .pipe(
        tap((updatedInvite) => {
          // Update in cached list
          const currentInvites = this.invites();
          const index = currentInvites.findIndex((i) => i.id === inviteId);
          if (index !== -1) {
            const updatedInvites = [...currentInvites];
            updatedInvites[index] = updatedInvite;
            this.invites.set(updatedInvites);
          }
        }),
        catchError((error) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Delete an invite
   */
  deleteInvite(childId: number, inviteId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.API_BASE}/${childId}/invites/${inviteId}/`)
      .pipe(
        tap(() => {
          // Remove from cached list
          const currentInvites = this.invites();
          this.invites.set(currentInvites.filter((i) => i.id !== inviteId));
        }),
        catchError((error) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Accept an invite using the token
   */
  acceptInvite(token: string): Observable<InviteAcceptResponse> {
    return this.http
      .post<InviteAcceptResponse>(`${this.API_BASE}/accept-invite/`, {
        token,
      })
      .pipe(
        catchError((error) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Generate full invite URL for sharing
   */
  getInviteUrl(token: string): string {
    // Get the current origin (protocol + domain + port)
    if (typeof window === 'undefined') {
      return `/invites/accept/${token}`;
    }
    return `${window.location.origin}/invites/accept/${token}`;
  }

  /**
   * Handle HTTP errors and return user-friendly messages
   */
  private handleError(error: unknown): Error {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as HttpErrorResponse;

      // Handle field-specific errors from Django
      if (httpError.error && typeof httpError.error === 'object') {
        const errorObj = httpError.error as Record<string, unknown>;

        // Handle field-specific errors
        const firstKey = Object.keys(errorObj)[0];
        if (firstKey && Array.isArray(errorObj[firstKey])) {
          const messages = errorObj[firstKey] as string[];
          return new Error(`${firstKey}: ${messages.join(', ')}`);
        }

        // Handle non_field_errors or detail
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

      // Handle HTTP status codes with sharing-specific messages
      if (httpError.status === 400) {
        return new Error('Invalid request. Please check your input.');
      }
      if (httpError.status === 401) {
        return new Error('You must be logged in to perform this action.');
      }
      if (httpError.status === 403) {
        return new Error(
          'Only the child owner can manage sharing and invites.'
        );
      }
      if (httpError.status === 404) {
        return new Error('Invite not found or has expired.');
      }
      if (httpError.status === 410) {
        return new Error('This invite has expired and is no longer valid.');
      }
      if (httpError.status === 500) {
        return new Error('Server error. Please try again later.');
      }
    }

    return new Error('An unexpected error occurred. Please try again.');
  }
}
