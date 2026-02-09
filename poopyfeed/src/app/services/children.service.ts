/**
 * Service for managing children via the PoopyFeed API
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Child, ChildCreate, ChildUpdate } from '../models/child.model';

@Injectable({
  providedIn: 'root',
})
export class ChildrenService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/children';

  // Reactive state
  children = signal<Child[]>([]);
  selectedChild = signal<Child | null>(null);

  /**
   * List all children accessible by the current user
   */
  list(): Observable<Child[]> {
    return this.http.get<Child[]>(`${this.API_BASE}/`).pipe(
      tap((children) => {
        this.children.set(children);
      }),
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get a single child by ID
   */
  get(id: number): Observable<Child> {
    return this.http.get<Child>(`${this.API_BASE}/${id}/`).pipe(
      tap((child) => {
        this.selectedChild.set(child);
      }),
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Create a new child
   */
  create(data: ChildCreate): Observable<Child> {
    return this.http.post<Child>(`${this.API_BASE}/`, data).pipe(
      tap((child) => {
        // Add to cached list
        const currentChildren = this.children();
        this.children.set([...currentChildren, child]);
      }),
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Update an existing child
   */
  update(id: number, data: ChildUpdate): Observable<Child> {
    return this.http.patch<Child>(`${this.API_BASE}/${id}/`, data).pipe(
      tap((updatedChild) => {
        // Update in cached list
        const currentChildren = this.children();
        const index = currentChildren.findIndex((c) => c.id === id);
        if (index !== -1) {
          const updatedChildren = [...currentChildren];
          updatedChildren[index] = updatedChild;
          this.children.set(updatedChildren);
        }
        // Update selected child if it matches
        if (this.selectedChild()?.id === id) {
          this.selectedChild.set(updatedChild);
        }
      }),
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Delete a child
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/${id}/`).pipe(
      tap(() => {
        // Remove from cached list
        const currentChildren = this.children();
        this.children.set(currentChildren.filter((c) => c.id !== id));
        // Clear selected child if it was deleted
        if (this.selectedChild()?.id === id) {
          this.selectedChild.set(null);
        }
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

        // Handle field-specific errors (e.g., {"name": ["This field is required"]})
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
        return new Error('Child not found.');
      }
      if (httpError.status === 500) {
        return new Error('Server error. Please try again later.');
      }
    }

    return new Error('An unexpected error occurred. Please try again.');
  }
}
