/**
 * Service for managing naps via the PoopyFeed API
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  // Reactive state
  naps = signal<Nap[]>([]);

  /**
   * Get base URL for nap operations
   */
  private baseUrl(childId: number): string {
    return `${this.API_BASE}/${childId}/naps`;
  }

  /**
   * List all naps for a child
   */
  list(childId: number): Observable<Nap[]> {
    return this.http.get<PaginatedResponse<Nap>>(`${this.baseUrl(childId)}/`).pipe(
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
