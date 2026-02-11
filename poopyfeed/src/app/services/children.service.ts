/**
 * Service for managing children via the PoopyFeed API.
 *
 * Provides CRUD operations for child profiles with automatic state caching via signals.
 * Maintains two reactive signals:
 * - `children`: List of all accessible children (from last list() call)
 * - `selectedChild`: Currently selected child (from last get() call)
 *
 * All HTTP operations include comprehensive error handling via ErrorHandler.
 * State is automatically updated after successful operations (optimistic updates).
 *
 * Endpoints:
 * - GET /api/v1/children/ - List all children
 * - GET /api/v1/children/{id}/ - Get single child
 * - POST /api/v1/children/ - Create new child
 * - PATCH /api/v1/children/{id}/ - Update child
 * - DELETE /api/v1/children/{id}/ - Delete child
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { Child, ChildCreate, ChildUpdate } from '../models/child.model';
import { ErrorHandler } from './error.utils';

/**
 * Django REST Framework paginated response wrapper.
 *
 * The API wraps list responses in pagination metadata. Use the `results` field
 * to access the actual array of items.
 *
 * @template T Type of items in the results array
 */
interface PaginatedResponse<T> {
  /** Total number of items across all pages */
  count: number;

  /** URL to next page (null if last page) */
  next: string | null;

  /** URL to previous page (null if first page) */
  previous: string | null;

  /** Array of items for this page */
  results: T[];
}

@Injectable({
  providedIn: 'root',
})
export class ChildrenService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/children';

  /**
   * List of all children accessible by current user (owned or shared).
   *
   * Updated by list() method. Contains results from last API call.
   * Use this signal in templates with async pipe or in computed() functions.
   *
   * @example
   * // In component
   * children = inject(ChildrenService).children;
   *
   * // In template
   * @for (child of childrenService.children(); track child.id) { ... }
   */
  children = signal<Child[]>([]);

  /**
   * Currently selected child from last get() call.
   *
   * Used when displaying single child detail page. Set by get() method,
   * cleared by delete() if deleted child was selected.
   */
  selectedChild = signal<Child | null>(null);

  /**
   * List all children accessible by the current user.
   *
   * Fetches owned children and children shared via ChildShare relationships.
   * Backend handles permission checks; only accessible children are returned.
   * Results are automatically cached in the `children` signal.
   *
   * @returns Observable<Child[]> Array of accessible children
   *
   * @example
   * constructor(private childrenService: ChildrenService) {}
   *
   * ngOnInit() {
   *   this.childrenService.list().subscribe({
   *     next: (children) => {
   *       console.log('Fetched children:', children);
   *       // children are also cached in childrenService.children signal
   *     },
   *     error: (err) => {
   *       // Error is wrapped in ApiError with message and details
   *       this.toast.error(err.message);
   *     }
   *   });
   * }
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
   * Get a single child by ID.
   *
   * Fetches detailed child profile including last activity timestamps
   * (last_diaper_change, last_nap, last_feeding).
   * Also updates the `selectedChild` signal for use in detail views.
   *
   * @param id Child's unique identifier
   * @returns Observable<Child> Single child object
   *
   * @throws ApiError if child not found or user lacks access
   *
   * @example
   * this.childrenService.get(childId).subscribe({
   *   next: (child) => {
   *     console.log('Child:', child);
   *     // Also available in childrenService.selectedChild signal
   *   }
   * });
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
   * Create a new child.
   *
   * Creates a child profile associated with the authenticated user as owner.
   * New child is automatically added to the `children` signal cache.
   * The child becomes immediately available for tracking (feedings, diapers, naps).
   *
   * @param data Child creation data (name, date_of_birth, gender)
   * @returns Observable<Child> Newly created child with ID and timestamps
   *
   * @throws ApiError if validation fails (e.g., invalid date format)
   *
   * @example
   * const newChild: ChildCreate = {
   *   name: 'Baby Alice',
   *   date_of_birth: '2024-01-15',
   *   gender: 'F'
   * };
   *
   * this.childrenService.create(newChild).subscribe({
   *   next: (child) => {
   *     this.toast.success(`${child.name} created successfully!`);
   *     // Child already cached in children signal
   *   }
   * });
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
   * Update an existing child.
   *
   * Updates child profile (name, date of birth, gender).
   * Only owners and co-parents can update. Backend enforces permission checks.
   * Updated child is reflected in both `children` and `selectedChild` signals.
   *
   * @param id Child's unique identifier
   * @param data Partial update data (any field can be omitted)
   * @returns Observable<Child> Updated child object
   *
   * @throws ApiError if child not found, user lacks access, or validation fails
   *
   * @example
   * const updates: ChildUpdate = {
   *   name: 'Alice Sarah'
   * };
   *
   * this.childrenService.update(childId, updates).subscribe({
   *   next: (child) => {
   *     this.toast.success(`${child.name} updated!`);
   *   }
   * });
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
   * Delete a child.
   *
   * Permanently removes child profile and all associated tracking records
   * (feedings, diapers, naps). Only the owner can delete a child.
   * Child is removed from both `children` and `selectedChild` signals.
   *
   * @param id Child's unique identifier
   * @returns Observable<void> Completes when deletion succeeds
   *
   * @throws ApiError if child not found or user is not owner
   *
   * @example
   * this.childrenService.delete(childId).subscribe({
   *   next: () => {
   *     this.toast.success('Child deleted');
   *     this.router.navigate(['/children']);
   *   }
   * });
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
