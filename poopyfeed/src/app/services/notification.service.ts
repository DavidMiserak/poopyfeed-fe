/**
 * Service for in-app notifications via the PoopyFeed API.
 *
 * Provides list, unread count, mark read, preferences, and quiet hours.
 * Polls unread count every 30s when started (browser only; respects visibility).
 *
 * Endpoints:
 * - GET  /api/v1/notifications/              - List notifications (paginated)
 * - GET  /api/v1/notifications/unread-count/ - Unread count
 * - POST /api/v1/notifications/mark-all-read/
 * - PATCH /api/v1/notifications/{id}/
 * - GET  /api/v1/notifications/preferences/
 * - PATCH /api/v1/notifications/preferences/{id}/
 * - GET  /api/v1/notifications/quiet-hours/
 * - PATCH /api/v1/notifications/quiet-hours/
 */

import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  tap,
  catchError,
  throwError,
  map,
  filter,
  merge,
  timer,
  fromEvent,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type {
  Notification,
  UnreadCountResponse,
  MarkAllReadResponse,
  NotificationPreference,
  NotificationPreferenceUpdate,
  QuietHours,
  QuietHoursUpdate,
} from '../models/notification.model';
import { ErrorHandler } from './error.utils';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface PreferencesListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationPreference[];
}

const NOTIFICATIONS_BASE = '/api/v1/notifications';
const POLL_INTERVAL_MS = 30_000;

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);

  /** Notifications from last list() call (e.g. for bell dropdown). */
  notifications = signal<Notification[]>([]);

  /** Unread count; updated by getUnreadCount() and by polling. */
  unreadCount = signal(0);

  /** True while the 30s unread-count polling is active. */
  isPolling = signal(false);

  /** Preferences from last getPreferences() call. */
  preferences = signal<NotificationPreference[]>([]);

  /** Quiet hours from last getQuietHours() call. */
  quietHours = signal<QuietHours | null>(null);

  /**
   * List notifications (paginated). Updates notifications signal.
   * @param page Page number (1-based)
   */
  list(page = 1): Observable<Notification[]> {
    return this.http
      .get<PaginatedResponse<Notification>>(`${NOTIFICATIONS_BASE}/`, {
        params: { page },
      })
      .pipe(
        map((res) => res.results),
        tap((list) => this.notifications.set(list)),
        catchError((err) =>
          throwError(() => ErrorHandler.handle(err, 'List notifications'))
        )
      );
  }

  /**
   * Fetch a single page of notifications without updating the notifications signal.
   * Use for the notifications page when loading more pages.
   */
  listPage(page: number): Observable<PaginatedResponse<Notification>> {
    return this.http
      .get<PaginatedResponse<Notification>>(`${NOTIFICATIONS_BASE}/`, {
        params: { page },
      })
      .pipe(
        catchError((err) =>
          throwError(() => ErrorHandler.handle(err, 'List notifications'))
        )
      );
  }

  /**
   * Fetch unread count. Updates unreadCount signal.
   */
  getUnreadCount(): Observable<number> {
    return this.http
      .get<UnreadCountResponse>(`${NOTIFICATIONS_BASE}/unread-count/`)
      .pipe(
        tap((res) => this.unreadCount.set(res.count)),
        map((res) => res.count),
        catchError((err) =>
          throwError(() =>
            ErrorHandler.handle(err, 'Get notification count')
          )
        )
      );
  }

  /**
   * Mark a single notification as read. Updates local state on success.
   */
  markAsRead(id: number): Observable<Notification> {
    return this.http
      .patch<Notification>(`${NOTIFICATIONS_BASE}/${id}/`, { is_read: true })
      .pipe(
        tap((updated) => {
          this.notifications.update((list) =>
            list.map((n) => (n.id === id ? { ...n, ...updated } : n))
          );
          if (!updated.is_read) return;
          this.unreadCount.update((c) => Math.max(0, c - 1));
        }),
        catchError((err) =>
          throwError(() =>
            ErrorHandler.handle(err, 'Mark notification as read')
          )
        )
      );
  }

  /**
   * Mark all notifications as read. Updates unreadCount and notifications on success.
   */
  markAllRead(): Observable<number> {
    return this.http
      .post<MarkAllReadResponse>(`${NOTIFICATIONS_BASE}/mark-all-read/`, {})
      .pipe(
        tap(() => {
          this.unreadCount.set(0);
          this.notifications.update((list) =>
            list.map((n) => ({ ...n, is_read: true }))
          );
        }),
        map((res) => res.updated),
        catchError((err) =>
          throwError(() =>
            ErrorHandler.handle(err, 'Mark all notifications as read')
          )
        )
      );
  }

  /**
   * List notification preferences (auto-created for accessible children). Updates preferences signal.
   */
  getPreferences(): Observable<NotificationPreference[]> {
    return this.http
      .get<PreferencesListResponse>(`${NOTIFICATIONS_BASE}/preferences/`)
      .pipe(
        map((res) => res.results),
        tap((list) => this.preferences.set(list)),
        catchError((err) =>
          throwError(() =>
            ErrorHandler.handle(err, 'Get notification preferences')
          )
        )
      );
  }

  /**
   * Update a notification preference.
   */
  updatePreference(
    id: number,
    body: NotificationPreferenceUpdate
  ): Observable<NotificationPreference> {
    return this.http
      .patch<NotificationPreference>(
        `${NOTIFICATIONS_BASE}/preferences/${id}/`,
        body
      )
      .pipe(
        tap((updated) => {
          this.preferences.update((list) =>
            list.map((p) => (p.id === id ? { ...p, ...updated } : p))
          );
        }),
        catchError((err) =>
          throwError(() =>
            ErrorHandler.handle(err, 'Update notification preference')
          )
        )
      );
  }

  /**
   * Get quiet hours (created with defaults if missing). Updates quietHours signal.
   */
  getQuietHours(): Observable<QuietHours> {
    return this.http
      .get<QuietHours>(`${NOTIFICATIONS_BASE}/quiet-hours/`)
      .pipe(
        tap((qh) => this.quietHours.set(qh)),
        catchError((err) =>
          throwError(() =>
            ErrorHandler.handle(err, 'Get quiet hours')
          )
        )
      );
  }

  /**
   * Update quiet hours.
   */
  updateQuietHours(body: QuietHoursUpdate): Observable<QuietHours> {
    return this.http
      .patch<QuietHours>(`${NOTIFICATIONS_BASE}/quiet-hours/`, body)
      .pipe(
        tap((qh) => this.quietHours.set(qh)),
        catchError((err) =>
          throwError(() =>
            ErrorHandler.handle(err, 'Update quiet hours')
          )
        )
      );
  }

  /**
   * Start polling unread count every 30s. Call from a component that has the document
   * (e.g. header). No-op under SSR. Pauses when document is hidden; refreshes on focus.
   */
  startUnreadCountPolling(destroyRef: DestroyRef): void {
    if (typeof document === 'undefined') return;

    this.isPolling.set(true);

    const whenVisible = filter(() => !document.hidden);
    const pollTick = timer(0, POLL_INTERVAL_MS).pipe(
      whenVisible,
      switchMap(() => this.getUnreadCount())
    );
    const onFocus = fromEvent(document, 'visibilitychange').pipe(
      filter(() => !document.hidden),
      switchMap(() => this.getUnreadCount())
    );

    merge(pollTick, onFocus)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({
        next: (): void => {
          return;
        },
        error: () => {
          this.isPolling.set(false);
        },
        complete: () => {
          this.isPolling.set(false);
        },
      });
  }
}
