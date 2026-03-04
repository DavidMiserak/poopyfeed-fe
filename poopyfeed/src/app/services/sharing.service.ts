/**
 * Service for managing child sharing and invites via the PoopyFeed API.
 *
 * Endpoints: GET/POST/DELETE /api/v1/children/{id}/shares/, GET/POST/PATCH/DELETE
 * /api/v1/children/{id}/invites/, POST /api/v1/invites/accept/. Caches shares
 * and invites in signals after list calls.
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
  private readonly INVITES_BASE = '/api/v1/invites';

  /** Cached shares from last listShares() call. */
  shares = signal<ChildShare[]>([]);
  /** Cached invites from last listInvites() call. */
  invites = signal<ShareInvite[]>([]);

  /**
   * List all shares for a child (existing access grants). Updates shares signal.
   *
   * @param childId - Child ID
   * @returns Observable of shares array
   * @throws ApiError on failure
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
   * Revoke a user's access to a child. Updates shares signal (removes revoked).
   *
   * @param childId - Child ID
   * @param shareId - Share ID to revoke
   * @returns Observable that completes on success
   * @throws ApiError on failure
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
   * List all invites for a child (pending invitations). Updates invites signal.
   *
   * @param childId - Child ID
   * @returns Observable of invites array
   * @throws ApiError on failure
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
   * Create a new invite link for a child. Appends to invites signal.
   *
   * @param childId - Child ID
   * @param data - Role (co-parent or caregiver)
   * @returns Observable of created invite (with token)
   * @throws ApiError on failure
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
   * Toggle an invite's active status. Updates invites signal.
   *
   * @param childId - Child ID
   * @param inviteId - Invite ID to update
   * @param isActive - New active state
   * @returns Observable of updated invite
   * @throws ApiError on failure
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
   * Delete an invite. Updates invites signal (removes deleted).
   *
   * @param childId - Child ID
   * @param inviteId - Invite ID to delete
   * @returns Observable that completes on success
   * @throws ApiError on failure
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
   * Accept an invite using the token from the invite link.
   *
   * @param token - Invite token (from URL /invites/accept/:token)
   * @returns Observable of response with child id and name
   * @throws ApiError on invalid/expired token
   */
  acceptInvite(token: string): Observable<InviteAcceptResponse> {
    return this.http
      .post<InviteAcceptResponse>(`${this.INVITES_BASE}/accept/`, {
        token,
      })
      .pipe(
        catchError((error) => {
          return throwError(() => ErrorHandler.handle(error, 'Accept'));
        })
      );
  }

  /**
   * Generate full invite URL for sharing (client: origin + path; SSR: path only).
   *
   * @param token - Invite token
   * @returns Full URL (e.g. https://app.example.com/invites/accept/uuid) or path
   */
  getInviteUrl(token: string): string {
    // Get the current origin (protocol + domain + port)
    if (typeof window === 'undefined') {
      return `/invites/accept/${token}`;
    }
    return `${window.location.origin}/invites/accept/${token}`;
  }
}
