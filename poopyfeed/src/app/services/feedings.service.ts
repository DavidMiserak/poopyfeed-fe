/**
 * Service for managing feedings via the PoopyFeed API
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
   * Get a single feeding by ID
   */
  get(childId: number, id: number): Observable<Feeding> {
    return this.http.get<Feeding>(`${this.baseUrl(childId)}/${id}/`).pipe(
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'Get'));
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
        return throwError(() => ErrorHandler.handle(error, 'Create'));
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
          return throwError(() => ErrorHandler.handle(error, 'Update'));
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
        return throwError(() => ErrorHandler.handle(error, 'Delete'));
      })
    );
  }
}
