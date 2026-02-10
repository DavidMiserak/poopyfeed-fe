/**
 * Service for managing diaper changes via the PoopyFeed API
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
