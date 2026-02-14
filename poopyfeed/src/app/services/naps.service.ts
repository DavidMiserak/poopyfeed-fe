/**
 * Service for managing naps via the PoopyFeed API.
 *
 * Provides CRUD operations for nap records. Naps track when a child took a nap,
 * storing only the start time (napped_at). Duration can be calculated by comparing
 * with next activity. Automatically caches naps list in reactive signal.
 *
 * All operations require the child to be accessible (owner/co-parent can add,
 * caregiver can add/view). API endpoints are nested under children:
 * `/api/v1/children/{childId}/naps/`
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ErrorHandler } from './error.utils';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { Nap, NapCreate, NapUpdate } from '../models/nap.model';

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
export class NapsService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/children';

  /**
   * Cached list of naps from last list() call.
   *
   * Automatically updated after create/update/delete operations.
   * Use in templates with async pipe or in computed() functions.
   */
  naps = signal<Nap[]>([]);

  /**
   * Get base URL for nap operations for a specific child.
   *
   * @param childId Child's unique identifier
   * @returns Base URL for this child's nap endpoints
   */
  private baseUrl(childId: number): string {
    return `${this.API_BASE}/${childId}/naps`;
  }

  /**
   * List all naps for a child with optional filtering.
   *
   * Returns naps sorted by napped_at descending (newest first).
   * Results are paginated (default 50 per page). Only naps for accessible
   * children can be fetched (owner/co-parent/caregiver all have view access).
   *
   * Optional query parameters for filtering:
   * - `napped_at__gte`: Filter on or after this date (ISO format)
   * - `napped_at__lt`: Filter before this date (ISO format)
   *
   * @param childId Child whose naps to fetch
   * @param filters Optional filter object with dateFrom, dateTo
   * @returns Observable<Nap[]> Array of naps for this child
   *
   * @throws ApiError if child not found or user lacks access
   */
  list(
    childId: number,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
    }
  ): Observable<Nap[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.dateFrom) {
        params = params.set('napped_at__gte', filters.dateFrom);
      }
      if (filters.dateTo) {
        params = params.set('napped_at__lt', filters.dateTo);
      }
    }

    return this.http
      .get<PaginatedResponse<Nap>>(`${this.baseUrl(childId)}/`, { params })
      .pipe(
        map((response) => response.results),
        tap((naps) => {
          this.naps.set(naps);
        }),
        catchError((error) => {
          return throwError(() => ErrorHandler.handle(error, 'List'));
        })
      );
  }

  /**
   * Get a single nap by ID
   */
  get(childId: number, id: number): Observable<Nap> {
    return this.http.get<Nap>(`${this.baseUrl(childId)}/${id}/`).pipe(
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Get'));
      })
    );
  }

  /**
   * Create a new nap
   */
  create(childId: number, data: NapCreate): Observable<Nap> {
    return this.http.post<Nap>(`${this.baseUrl(childId)}/`, data).pipe(
      tap((nap) => {
        // Add to cached list
        const currentNaps = this.naps();
        this.naps.set([...currentNaps, nap]);
      }),
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Create'));
      })
    );
  }

  /**
   * Update an existing nap
   */
  update(childId: number, id: number, data: NapUpdate): Observable<Nap> {
    return this.http
      .patch<Nap>(`${this.baseUrl(childId)}/${id}/`, data)
      .pipe(
        tap((updatedNap) => {
          // Update in cached list
          const currentNaps = this.naps();
          const index = currentNaps.findIndex((n) => n.id === id);
          if (index !== -1) {
            const updatedNaps = [...currentNaps];
            updatedNaps[index] = updatedNap;
            this.naps.set(updatedNaps);
          }
        }),
        catchError((error) => {
          return throwError(() => ErrorHandler.handle(error, 'Update'));
        })
      );
  }

  /**
   * Delete a nap
   */
  delete(childId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(childId)}/${id}/`).pipe(
      tap(() => {
        // Remove from cached list
        const currentNaps = this.naps();
        this.naps.set(currentNaps.filter((n) => n.id !== id));
      }),
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Delete'));
      })
    );
  }
}
