/**
 * Service for managing naps via the PoopyFeed API
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get a single nap by ID
   */
  get(childId: number, id: number): Observable<Nap> {
    return this.http.get<Nap>(`${this.baseUrl(childId)}/${id}/`).pipe(
      catchError((error) => {
        return throwError(() => this.handleError(error));
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
        return throwError(() => this.handleError(error));
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
          return throwError(() => this.handleError(error));
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
        return throwError(() => this.handleError(error));
      })
    );
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

      // Handle HTTP status codes
      if (httpError.status === 400) {
        return new Error('Invalid request. Please check your input.');
      }
      if (httpError.status === 401) {
        return new Error('You must be logged in to perform this action.');
      }
      if (httpError.status === 403) {
        return new Error('You do not have permission to perform this action.');
      }
      if (httpError.status === 404) {
        return new Error('Nap not found.');
      }
      if (httpError.status === 500) {
        return new Error('Server error. Please try again later.');
      }
    }

    return new Error('An unexpected error occurred. Please try again.');
  }
}
