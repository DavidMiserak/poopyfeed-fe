/**
 * Service for managing feedings via the PoopyFeed API.
 *
 * Provides CRUD operations for feeding records (bottle and breast feeding).
 * Automatically caches feedings list in reactive signal for efficient updates.
 *
 * Feeding types and validation:
 * - **Bottle**: Requires amount_oz (0.1-50.0 oz), no breast fields
 * - **Breast**: Requires duration_minutes (1-180) and side (left/right/both), no amount
 *
 * All operations require the child to be accessible (owner/co-parent can add, caregiver can add/view).
 * API endpoints are nested under children: `/api/v1/children/{childId}/feedings/`
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ErrorHandler } from './error.utils';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import {
  Feeding,
  FeedingCreate,
  FeedingUpdate,
} from '../models/feeding.model';

/**
 * Django REST Framework paginated response wrapper.
 *
 * @template T Type of items in the results array
 */
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root',
})
export class FeedingsService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/children';

  /**
   * Cached list of feedings from last list() call.
   *
   * Automatically updated after create/update/delete operations.
   * Use in templates with async pipe or in computed() functions.
   */
  feedings = signal<Feeding[]>([]);

  /**
   * Get base URL for feeding operations for a specific child.
   *
   * @param childId Child's unique identifier
   * @returns Base URL for this child's feeding endpoints
   */
  private baseUrl(childId: number): string {
    return `${this.API_BASE}/${childId}/feedings`;
  }

  /**
   * List all feedings for a child.
   *
   * Returns feedings sorted by fed_at descending (newest first).
   * Results are paginated (default 50 per page). Only feedings for accessible
   * children can be fetched (owner/co-parent/caregiver all have view access).
   *
   * @param childId Child whose feedings to fetch
   * @returns Observable<Feeding[]> Array of feedings for this child
   *
   * @throws ApiError if child not found or user lacks access
   *
   * @example
   * this.feedingsService.list(childId).subscribe({
   *   next: (feedings) => {
   *     console.log('Feedings:', feedings);
   *     // Also cached in feedingsService.feedings signal
   *   }
   * });
   */
  list(childId: number): Observable<Feeding[]> {
    return this.http.get<PaginatedResponse<Feeding>>(`${this.baseUrl(childId)}/`).pipe(
      map((response) => response.results),
      tap((feedings) => {
        this.feedings.set(feedings);
      }),
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'List'));
      })
    );
  }

  /**
   * Get a single feeding by ID.
   *
   * Fetches complete feeding details including both bottle and breast fields.
   * Note: Conditional fields (amount_oz OR duration_minutes/side) will be null
   * depending on feeding_type.
   *
   * @param childId Child who owns this feeding
   * @param id Feeding's unique identifier
   * @returns Observable<Feeding> Complete feeding object
   *
   * @throws ApiError if feeding not found or user lacks access
   */
  get(childId: number, id: number): Observable<Feeding> {
    return this.http.get<Feeding>(`${this.baseUrl(childId)}/${id}/`).pipe(
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Get'));
      })
    );
  }

  /**
   * Create a new feeding record.
   *
   * Supports bottle and breast feeding with conditional field validation:
   * - **Bottle**: feeding_type='bottle', requires amount_oz (0.1-50.0 oz)
   * - **Breast**: feeding_type='breast', requires duration_minutes (1-180) and side
   *
   * Form validation should enforce these conditional requirements before submission.
   * Only owners and co-parents can add feedings. Caregivers can also add.
   * New feeding is automatically added to the feedings signal cache.
   *
   * @param childId Child to add feeding for
   * @param data Feeding creation data with conditional fields based on type
   * @returns Observable<Feeding> Created feeding with ID and timestamps
   *
   * @throws ApiError if validation fails (type mismatch, invalid amounts, etc.)
   *
   * @example
   * // Bottle feeding
   * const bottleFeeding: FeedingCreate = {
   *   feeding_type: 'bottle',
   *   fed_at: '2024-01-15T10:30:00Z',
   *   amount_oz: 5.5,
   *   notes: 'Took bottle well'
   * };
   *
   * // Breast feeding
   * const breastFeeding: FeedingCreate = {
   *   feeding_type: 'breast',
   *   fed_at: '2024-01-15T10:30:00Z',
   *   duration_minutes: 15,
   *   side: 'left'
   * };
   *
   * this.feedingsService.create(childId, bottleFeeding).subscribe({
   *   next: (feeding) => {
   *     this.toast.success('Feeding recorded!');
   *   }
   * });
   */
  create(childId: number, data: FeedingCreate): Observable<Feeding> {
    return this.http.post<Feeding>(`${this.baseUrl(childId)}/`, data).pipe(
      tap((feeding) => {
        // Add to cached list
        const currentFeedings = this.feedings();
        this.feedings.set([...currentFeedings, feeding]);
      }),
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Create'));
      })
    );
  }

  /**
   * Update an existing feeding record.
   *
   * Can update any feeding field. Conditional field rules still apply:
   * changing feeding_type requires appropriate new fields.
   * Only owners and co-parents can update feedings.
   * Updated feeding is reflected in the feedings signal cache.
   *
   * @param childId Child who owns this feeding
   * @param id Feeding's unique identifier
   * @param data Partial update data (any field can be omitted)
   * @returns Observable<Feeding> Updated feeding object
   *
   * @throws ApiError if feeding not found, validation fails, or user lacks permission
   */
  update(
    childId: number,
    id: number,
    data: FeedingUpdate
  ): Observable<Feeding> {
    return this.http
      .patch<Feeding>(`${this.baseUrl(childId)}/${id}/`, data)
      .pipe(
        tap((updatedFeeding) => {
          // Update in cached list
          const currentFeedings = this.feedings();
          const index = currentFeedings.findIndex((f) => f.id === id);
          if (index !== -1) {
            const updatedFeedings = [...currentFeedings];
            updatedFeedings[index] = updatedFeeding;
            this.feedings.set(updatedFeedings);
          }
        }),
        catchError((error) => {
          return throwError(() => ErrorHandler.handle(error, 'Update'));
        })
      );
  }

  /**
   * Delete a feeding record.
   *
   * Permanently removes the feeding from the child's history.
   * Only owners and co-parents can delete feedings.
   * Feeding is removed from the feedings signal cache.
   *
   * @param childId Child who owns this feeding
   * @param id Feeding's unique identifier
   * @returns Observable<void> Completes when deletion succeeds
   *
   * @throws ApiError if feeding not found or user is not owner/co-parent
   */
  delete(childId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(childId)}/${id}/`).pipe(
      tap(() => {
        // Remove from cached list
        const currentFeedings = this.feedings();
        this.feedings.set(currentFeedings.filter((f) => f.id !== id));
      }),
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Delete'));
      })
    );
  }
}
