/**
 * Service for fetching analytics data from the PoopyFeed analytics API.
 *
 * Provides methods to fetch trend data (feeding, diaper, sleep) and summary statistics.
 * All data is cached in signals for reactive component updates.
 *
 * Endpoints:
 * - GET /api/v1/analytics/children/{child_id}/feeding-trends/?days=30
 * - GET /api/v1/analytics/children/{child_id}/diaper-patterns/?days=30
 * - GET /api/v1/analytics/children/{child_id}/sleep-summary/?days=30
 * - GET /api/v1/analytics/children/{child_id}/today-summary/
 * - GET /api/v1/analytics/children/{child_id}/weekly-summary/
 *
 * Backend caching strategy:
 * - Trend endpoints: 1 hour TTL (updated when tracking records change)
 * - Today/Weekly: 5-10 minute TTL (update frequently)
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ErrorHandler } from './error.utils';
import {
  FeedingTrends,
  DiaperPatterns,
  SleepSummary,
  TodaySummaryData,
  WeeklySummaryData,
} from '../models/analytics.model';

/**
 * Analytics service for trend and summary data.
 *
 * Manages HTTP requests to analytics endpoints and caches responses in signals.
 * All methods follow consistent error handling patterns via ErrorHandler.
 */
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/analytics/children';

  /**
   * Cached feeding trends from last getFeedingTrends() call.
   *
   * Updated by getFeedingTrends() method. Null if not yet loaded.
   */
  feedingTrends = signal<FeedingTrends | null>(null);

  /**
   * Cached diaper patterns from last getDiaperPatterns() call.
   *
   * Updated by getDiaperPatterns() method. Null if not yet loaded.
   */
  diaperPatterns = signal<DiaperPatterns | null>(null);

  /**
   * Cached sleep summary from last getSleepSummary() call.
   *
   * Updated by getSleepSummary() method. Null if not yet loaded.
   */
  sleepSummary = signal<SleepSummary | null>(null);

  /**
   * Cached today's summary from last getTodaySummary() call.
   *
   * Updated by getTodaySummary() method. Null if not yet loaded.
   */
  todaySummary = signal<TodaySummaryData | null>(null);

  /**
   * Cached weekly summary from last getWeeklySummary() call.
   *
   * Updated by getWeeklySummary() method. Null if not yet loaded.
   */
  weeklySummary = signal<WeeklySummaryData | null>(null);

  /**
   * Fetch feeding trends for a child.
   *
   * Returns daily feeding counts and statistics for the specified date range.
   * Results are cached in the `feedingTrends` signal for reactive updates.
   *
   * @param childId Child's unique identifier
   * @param days Number of days to include (default 30, max 90)
   * @returns Observable<FeedingTrends> Feeding trend data
   *
   * @throws ApiError if child not found or user lacks access
   *
   * @example
   * this.analyticsService.getFeedingTrends(1, 30).subscribe({
   *   next: (trends) => {
   *     console.log('Feeding trends:', trends);
   *     // Also available in analyticsService.feedingTrends signal
   *   },
   *   error: (err: Error) => {
   *     this.toast.error(err.message);
   *   }
   * });
   */
  getFeedingTrends(childId: number, days: number = 30): Observable<FeedingTrends> {
    const params = new HttpParams().set('days', days.toString());

    return this.http
      .get<FeedingTrends>(`${this.API_BASE}/${childId}/feeding-trends/`, { params })
      .pipe(
        tap((trends) => this.feedingTrends.set(trends)),
        catchError((error) =>
          throwError(() => ErrorHandler.handle(error, 'Get feeding trends'))
        )
      );
  }

  /**
   * Fetch diaper patterns for a child.
   *
   * Returns daily diaper counts and breakdown by type for the specified date range.
   * Results are cached in the `diaperPatterns` signal for reactive updates.
   *
   * @param childId Child's unique identifier
   * @param days Number of days to include (default 30, max 90)
   * @returns Observable<DiaperPatterns> Diaper pattern data
   *
   * @throws ApiError if child not found or user lacks access
   *
   * @example
   * this.analyticsService.getDiaperPatterns(1, 30).subscribe({
   *   next: (patterns) => {
   *     console.log('Diaper patterns:', patterns);
   *   }
   * });
   */
  getDiaperPatterns(childId: number, days: number = 30): Observable<DiaperPatterns> {
    const params = new HttpParams().set('days', days.toString());

    return this.http
      .get<DiaperPatterns>(`${this.API_BASE}/${childId}/diaper-patterns/`, { params })
      .pipe(
        tap((patterns) => this.diaperPatterns.set(patterns)),
        catchError((error) =>
          throwError(() => ErrorHandler.handle(error, 'Get diaper patterns'))
        )
      );
  }

  /**
   * Fetch sleep summary for a child.
   *
   * Returns daily nap counts and average duration for the specified date range.
   * Results are cached in the `sleepSummary` signal for reactive updates.
   *
   * @param childId Child's unique identifier
   * @param days Number of days to include (default 30, max 90)
   * @returns Observable<SleepSummary> Sleep summary data
   *
   * @throws ApiError if child not found or user lacks access
   *
   * @example
   * this.analyticsService.getSleepSummary(1, 30).subscribe({
   *   next: (summary) => {
   *     console.log('Sleep summary:', summary);
   *   }
   * });
   */
  getSleepSummary(childId: number, days: number = 30): Observable<SleepSummary> {
    const params = new HttpParams().set('days', days.toString());

    return this.http
      .get<SleepSummary>(`${this.API_BASE}/${childId}/sleep-summary/`, { params })
      .pipe(
        tap((summary) => this.sleepSummary.set(summary)),
        catchError((error) =>
          throwError(() => ErrorHandler.handle(error, 'Get sleep summary'))
        )
      );
  }

  /**
   * Fetch today's summary for a child.
   *
   * Returns quick stats for all activities today: feedings, diapers, sleep.
   * Results are cached in the `todaySummary` signal for reactive updates.
   *
   * @param childId Child's unique identifier
   * @returns Observable<TodaySummaryData> Today's summary data
   *
   * @throws ApiError if child not found or user lacks access
   *
   * @example
   * this.analyticsService.getTodaySummary(1).subscribe({
   *   next: (summary) => {
   *     console.log("Today's stats:", summary);
   *   }
   * });
   */
  getTodaySummary(childId: number): Observable<TodaySummaryData> {
    return this.http.get<TodaySummaryData>(`${this.API_BASE}/${childId}/today-summary/`).pipe(
      tap((summary) => this.todaySummary.set(summary)),
      catchError((error) =>
        throwError(() => ErrorHandler.handle(error, "Get today's summary"))
      )
    );
  }

  /**
   * Fetch weekly summary for a child.
   *
   * Returns aggregated statistics for the past 7 days.
   * Results are cached in the `weeklySummary` signal for reactive updates.
   *
   * @param childId Child's unique identifier
   * @returns Observable<WeeklySummaryData> Weekly summary data
   *
   * @throws ApiError if child not found or user lacks access
   *
   * @example
   * this.analyticsService.getWeeklySummary(1).subscribe({
   *   next: (summary) => {
   *     console.log("Weekly stats:", summary);
   *   }
   * });
   */
  getWeeklySummary(childId: number): Observable<WeeklySummaryData> {
    return this.http.get<WeeklySummaryData>(`${this.API_BASE}/${childId}/weekly-summary/`).pipe(
      tap((summary) => this.weeklySummary.set(summary)),
      catchError((error) =>
        throwError(() => ErrorHandler.handle(error, 'Get weekly summary'))
      )
    );
  }
}
