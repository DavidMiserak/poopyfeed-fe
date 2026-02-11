/**
 * Service for managing diaper changes via the PoopyFeed API.
 *
 * Provides CRUD operations for diaper change records (wet, dirty, or both).
 * Automatically caches diaper changes list in reactive signal for efficient updates.
 *
 * Change types:
 * - **wet**: Urine only
 * - **dirty**: Feces/stool only
 * - **both**: Both urine and feces
 *
 * All operations require the child to be accessible (owner/co-parent can add,
 * caregiver can add/view). API endpoints are nested under children:
 * `/api/v1/children/{childId}/diapers/`
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ErrorHandler } from './error.utils';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import {
  DiaperChange,
  DiaperChangeCreate,
  DiaperChangeUpdate,
} from '../models/diaper.model';

// Django REST Framework paginated response
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root',
})
export class DiapersService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/children';

  /**
   * Cached list of diaper changes from last list() call.
   *
   * Automatically updated after create/update/delete operations.
   * Use in templates with async pipe or in computed() functions.
   */
  diapers = signal<DiaperChange[]>([]);

  /**
   * Get base URL for diaper operations for a specific child.
   *
   * @param childId Child's unique identifier
   * @returns Base URL for this child's diaper change endpoints
   */
  private baseUrl(childId: number): string {
    return `${this.API_BASE}/${childId}/diapers`;
  }

  /**
   * List all diaper changes for a child.
   *
   * Returns diaper changes sorted by changed_at descending (newest first).
   * Results are paginated (default 50 per page). Only diaper changes for accessible
   * children can be fetched (owner/co-parent/caregiver all have view access).
   *
   * @param childId Child whose diaper changes to fetch
   * @returns Observable<DiaperChange[]> Array of diaper changes for this child
   *
   * @throws ApiError if child not found or user lacks access
   */
  list(childId: number): Observable<DiaperChange[]> {
    return this.http.get<PaginatedResponse<DiaperChange>>(`${this.baseUrl(childId)}/`).pipe(
      map((response) => response.results),
      tap((diapers) => {
        this.diapers.set(diapers);
      }),
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'List'));
      })
    );
  }

  /**
   * Get a single diaper change by ID
   */
  get(childId: number, id: number): Observable<DiaperChange> {
    return this.http.get<DiaperChange>(`${this.baseUrl(childId)}/${id}/`).pipe(
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Get'));
      })
    );
  }

  /**
   * Create a new diaper change
   */
  create(
    childId: number,
    data: DiaperChangeCreate
  ): Observable<DiaperChange> {
    return this.http.post<DiaperChange>(`${this.baseUrl(childId)}/`, data).pipe(
      tap((diaper) => {
        // Add to cached list
        const currentDiapers = this.diapers();
        this.diapers.set([...currentDiapers, diaper]);
      }),
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Create'));
      })
    );
  }

  /**
   * Update an existing diaper change
   */
  update(
    childId: number,
    id: number,
    data: DiaperChangeUpdate
  ): Observable<DiaperChange> {
    return this.http
      .patch<DiaperChange>(`${this.baseUrl(childId)}/${id}/`, data)
      .pipe(
        tap((updatedDiaper) => {
          // Update in cached list
          const currentDiapers = this.diapers();
          const index = currentDiapers.findIndex((d) => d.id === id);
          if (index !== -1) {
            const updatedDiapers = [...currentDiapers];
            updatedDiapers[index] = updatedDiaper;
            this.diapers.set(updatedDiapers);
          }
        }),
        catchError((error) => {
          return throwError(() => ErrorHandler.handle(error, 'Update'));
        })
      );
  }

  /**
   * Delete a diaper change
   */
  delete(childId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(childId)}/${id}/`).pipe(
      tap(() => {
        // Remove from cached list
        const currentDiapers = this.diapers();
        this.diapers.set(currentDiapers.filter((d) => d.id !== id));
      }),
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Delete'));
      })
    );
  }
}
