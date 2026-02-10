/**
 * Service for managing children via the PoopyFeed API
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { Child, ChildCreate, ChildUpdate } from '../models/child.model';
import { ErrorHandler } from './error.utils';

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
    return this.http.get<PaginatedResponse<Child>>(`${this.API_BASE}/`).pipe(
      map((response) => response.results),
      tap((children) => {
        this.children.set(children);
      }),
      catchError((error) => {
        return throwError(() => ErrorHandler.handle(error, 'List children'));
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
        return throwError(() => ErrorHandler.handle(error, 'Get child'));
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
        return throwError(() => ErrorHandler.handle(error, 'Create child'));
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
        return throwError(() => ErrorHandler.handle(error, 'Update child'));
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
        return throwError(() => ErrorHandler.handle(error, 'Delete child'));
      })
    );
  }
}
