/**
 * Service for managing diaper changes via the PoopyFeed API
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  DiaperChange,
  DiaperChangeCreate,
  DiaperChangeUpdate,
} from '../models/diaper.model';

@Injectable({
  providedIn: 'root',
})
export class DiapersService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/children';

  // Reactive state
  diapers = signal<DiaperChange[]>([]);

  /**
   * Get base URL for diaper operations
   */
  private baseUrl(childId: number): string {
    return `${this.API_BASE}/${childId}/diapers`;
  }

  /**
   * List all diaper changes for a child
   */
  list(childId: number): Observable<DiaperChange[]> {
    return this.http.get<DiaperChange[]>(`${this.baseUrl(childId)}/`).pipe(
      tap((diapers) => {
        this.diapers.set(diapers);
      }),
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get a single diaper change by ID
   */
  get(childId: number, id: number): Observable<DiaperChange> {
    return this.http.get<DiaperChange>(`${this.baseUrl(childId)}/${id}/`).pipe(
      catchError((error) => {
        return throwError(() => this.handleError(error));
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
        return throwError(() => this.handleError(error));
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
          return throwError(() => this.handleError(error));
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
        return new Error('Diaper change not found.');
      }
      if (httpError.status === 500) {
        return new Error('Server error. Please try again later.');
      }
    }

    return new Error('An unexpected error occurred. Please try again.');
  }
}
