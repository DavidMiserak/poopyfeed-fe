/**
 * Pagination types for DRF-style API responses.
 *
 * Used by list endpoints (children, feedings, diapers, naps, notifications)
 * and by client-side pagination components.
 */

/**
 * Django REST Framework paginated response shape.
 *
 * @template T - Type of each item in the results array
 * @interface PaginatedResponse
 */
export interface PaginatedResponse<T> {
  /** Total number of items across all pages */
  count: number;

  /** URL to next page (null if last page) */
  next: string | null;

  /** URL to previous page (null if first page) */
  previous: string | null;

  /** Array of items for this page */
  results: T[];
}

/**
 * Client-side pagination state for UI (page, totalPages, etc.).
 *
 * Derived from PaginatedResponse or maintained by list components.
 *
 * @interface PaginationMeta
 */
export interface PaginationMeta {
  /** Total number of items */
  count: number;

  /** URL to next page (null if last page) */
  next: string | null;

  /** URL to previous page (null if first page) */
  previous: string | null;

  /** Current 1-based page number */
  page: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;
}

/** Default number of items per page for list endpoints (matches backend default). */
export const DEFAULT_PAGE_SIZE = 20;
