/**
 * Service for managing feedings via the PoopyFeed API
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  Feeding,
  FeedingCreate,
  FeedingUpdate,
} from '../models/feeding.model';

@Injectable({
  providedIn: 'root',
})
export class FeedingsService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/children';

  // Reactive state
  feedings = signal<Feeding[]>([]);

  /**
   * Get base URL for feeding operations
   */
  private baseUrl(childId: number): string {
    return `${this.API_BASE}/${childId}/feedings`;
  }

  /**
   * List all feedings for a child
   */
  list(childId: number): Observable<Feeding[]> {
    return this.http.get<Feeding[]>(`${this.baseUrl(childId)}/`).pipe(
      tap((feedings) => {
        this.feedings.set(feedings);
      }),
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get a single feeding by ID
   */
  get(childId: number, id: number): Observable<Feeding> {
    return this.http.get<Feeding>(`${this.baseUrl(childId)}/${id}/`).pipe(
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Create a new feeding
   */
  create(childId: number, data: FeedingCreate): Observable<Feeding> {
    return this.http.post<Feeding>(`${this.baseUrl(childId)}/`, data).pipe(
      tap((feeding) => {
        // Add to cached list
        const currentFeedings = this.feedings();
        this.feedings.set([...currentFeedings, feeding]);
      }),
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Update an existing feeding
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
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Delete a feeding
   */
  delete(childId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(childId)}/${id}/`).pipe(
      tap(() => {
        // Remove from cached list
        const currentFeedings = this.feedings();
        this.feedings.set(currentFeedings.filter((f) => f.id !== id));
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
        return new Error('Feeding not found.');
      }
      if (httpError.status === 500) {
        return new Error('Server error. Please try again later.');
      }
    }

    return new Error('An unexpected error occurred. Please try again.');
  }
}
