/**
 * Service for submitting batch event creation requests to the backend.
 *
 * The batch endpoint atomically creates multiple events (feedings, diapers, naps)
 * in a single transaction. If any event fails validation, no events are created.
 *
 * Endpoint: POST /api/v1/children/{childId}/batch/
 *
 * Request format:
 * ```json
 * {
 *   "events": [
 *     {
 *       "type": "feeding",
 *       "data": { "feeding_type": "bottle", "fed_at": "...", "amount_oz": 4 }
 *     },
 *     ...
 *   ]
 * }
 * ```
 *
 * Success response (201):
 * ```json
 * {
 *   "created": [ ... ],
 *   "count": 3
 * }
 * ```
 *
 * Error response (400):
 * ```json
 * {
 *   "errors": [
 *     {
 *       "index": 0,
 *       "type": "feeding",
 *       "errors": { "amount_oz": ["Amount is required..."] }
 *     }
 *   ]
 * }
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  BatchRequest,
  BatchResponse,
  BatchErrorResponse,
  CatchUpEvent,
} from '../models';
import { ErrorHandler } from './error.utils';

/**
 * HTTP error response with batch-specific error details.
 *
 * Extends the standard ApiError with batch error information,
 * allowing the frontend to highlight specific event cards.
 */
interface BatchApiError extends Error {
  status?: number;
  batchErrors?: BatchErrorResponse;
}

@Injectable({
  providedIn: 'root',
})
export class BatchesService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/children';

  /**
   * Submit a batch of events for creation.
   *
   * Sends all events to the backend in a single atomic transaction.
   * If any event fails validation, the entire batch is rejected and
   * no events are created.
   *
   * @param childId - ID of the child
   * @param events - Array of events to create
   * @returns Observable of BatchResponse (with created events and count)
   * @throws Observable error with detailed validation errors on failure
   *
   * @example
   * this.batchService.create(1, events).subscribe({
   *   next: (response) => {
   *     this.toast.success(`${response.count} events saved successfully`);
   *     this.router.navigate(['/children', childId]);
   *   },
   *   error: (err: BatchApiError) => {
   *     if (err.batchErrors) {
   *       // Highlight specific event cards with field-level errors
   *       err.batchErrors.errors.forEach(eventError => {
   *         console.log(`Event ${eventError.index} has errors:`, eventError.errors);
   *       });
   *     }
   *   }
   * });
   */
  create(childId: number, events: CatchUpEvent[]): Observable<BatchResponse> {
    const request: BatchRequest = {
      events: events
        .filter((e) => !e.isExisting) // Exclude read-only existing events
        .map((event) => ({
          type: event.type,
          data: {
            ...event.data,
            // Update timestamp fields to use the estimated/edited time
            ...(event.type === 'feeding' && {
              fed_at: event.estimatedTime,
            }),
            ...(event.type === 'diaper' && {
              changed_at: event.estimatedTime,
            }),
            ...(event.type === 'nap' && {
              napped_at: event.estimatedTime,
            }),
          },
        })),
    };

    return this.http
      .post<BatchResponse>(`${this.API_BASE}/${childId}/batch/`, request)
      .pipe(
        catchError((error) =>
          this.handleError(error, events.length),
        ),
      );
  }

  /**
   * Parse batch-specific errors from HTTP response.
   *
   * The backend returns per-event validation errors with indices,
   * allowing the frontend to highlight specific cards. This method
   * extracts that information for UI display.
   *
   * @param error - HTTP error response
   * @param totalEvents - Total events in the request (for logging)
   * @returns Observable error with parsed batch details
   *
   * @internal
   */
  private handleError(
    error: HttpErrorResponse,
    totalEvents: number,
  ): Observable<never> {
    // Try to parse batch-specific error format
    if (error.status === 400 && error.error?.errors) {
      const batchError = error.error as BatchErrorResponse;
      const apiError = new Error(
        'Batch validation failed',
      ) as BatchApiError;
      apiError.status = 400;
      apiError.batchErrors = batchError;

      return throwError(() => apiError);
    }

    // Fall back to standard error handler
    const standardError = ErrorHandler.handle(error);
    return throwError(() => standardError);
  }
}
