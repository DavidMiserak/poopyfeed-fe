/**
 * Pagination types for DRF-style API responses.
 */

/** Django REST Framework paginated response shape. */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Client-side pagination state for UI (page, totalPages, etc.). */
export interface PaginationMeta {
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 20;
