/**
 * Service for managing child sharing and invites via the PoopyFeed API
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ErrorHandler } from './error.utils';
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
          return throwError(() => ErrorHandler.handle(error, 'List'));
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
          return throwError(() => ErrorHandler.handle(error, 'Delete'));
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
          return throwError(() => ErrorHandler.handle(error, 'List'));
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
          return throwError(() => ErrorHandler.handle(error, 'Create'));
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
          return throwError(() => ErrorHandler.handle(error, 'Update'));
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
          return throwError(() => ErrorHandler.handle(error, 'Delete'));
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
          return throwError(() => ErrorHandler.handle(error, 'Accept'));
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
}
