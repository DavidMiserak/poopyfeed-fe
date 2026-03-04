import { HttpErrorResponse } from '@angular/common/http';

/**
 * Custom error class for API-related errors.
 *
 * Contains a user-friendly message, optional HTTP status, and the original
 * error for logging. Use isAuthError(), isValidationError(), etc. for branching.
 *
 * @example
 * ```typescript
 * this.service.list().subscribe({
 *   error: (err: Error) => {
 *     const apiErr = ErrorHandler.handle(err, 'List children');
 *     if (apiErr.isAuthError()) this.router.navigate(['/login']);
 *     else this.toast.error(apiErr.message);
 *   }
 * });
 * ```
 */
export class ApiError extends Error {
  /**
   * Create an ApiError.
   *
   * @param message - User-friendly error message
   * @param status - HTTP status code if from HTTP response (optional)
   * @param originalError - Original error or response body (optional)
   */
  constructor(
    message: string,
    readonly status?: number,
    readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if error is due to authentication failure (401 or 403).
   *
   * @returns True if status is 401 or 403
   */
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Check if error is due to not found (404).
   *
   * @returns True if status is 404
   */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Check if error is due to validation failure (400).
   *
   * @returns True if status is 400
   */
  isValidationError(): boolean {
    return this.status === 400;
  }

  /**
   * Check if error is due to conflict (409, e.g. duplicate entry).
   *
   * @returns True if status is 409
   */
  isConflictError(): boolean {
    return this.status === 409;
  }

  /**
   * Check if error is due to server error (5xx).
   *
   * @returns True if status is 500 or higher
   */
  isServerError(): boolean {
    return this.status ? this.status >= 500 : false;
  }
}

/**
 * Error handler utility for standardizing error handling across all services.
 *
 * Converts HTTP errors (including Django non_field_errors, detail, and
 * field-specific formats) and other errors into user-friendly ApiError instances.
 */
export class ErrorHandler {
  /**
   * Handle any error and return a user-friendly ApiError.
   *
   * Supports HttpErrorResponse (Django detail, non_field_errors, field errors),
   * Error, string, and generic objects. Use the returned ApiError's message
   * for toasts and status for branching.
   *
   * @param error - Caught error (HTTP response, Error, string, or object)
   * @param operation - Optional context (e.g. 'List children') prepended to message
   * @returns ApiError with user-friendly message and optional status
   *
   * @example
   * ```typescript
   * catchError(err => throwError(() => ErrorHandler.handle(err, 'Create feeding')))
   * ```
   */
  static handle(error: unknown, operation?: string): ApiError {
    const operationText = operation ? `${operation}: ` : '';

    // Handle HTTP errors
    if (error instanceof HttpErrorResponse) {
      return this.handleHttpError(error, operation);
    }

    // Handle other errors
    if (error instanceof Error) {
      return new ApiError(`${operationText}${error.message}`, undefined, error);
    }

    if (typeof error === 'string') {
      return new ApiError(`${operationText}${error}`, undefined, error);
    }

    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      const message = errorObj['message'] || errorObj['detail'] || 'An unexpected error occurred';
      return new ApiError(`${operationText}${message}`, undefined, error);
    }

    return new ApiError(`${operationText}An unexpected error occurred`, undefined, error);
  }

  /**
   * Handle HTTP error responses with support for Django error formats.
   *
   * @param error - Angular HttpErrorResponse
   * @param operation - Optional context prepended to message
   * @returns ApiError with parsed message and status
   */
  private static handleHttpError(error: HttpErrorResponse, operation?: string): ApiError {
    const operationText = operation ? `${operation}: ` : '';

    // Handle non_field_errors or detail first (higher priority)
    const detailError = this.extractDetailError(error.error);
    if (detailError) {
      return new ApiError(`${operationText}${detailError}`, error.status, error);
    }

    // Handle field-specific errors from Django (e.g., {"name": ["This field is required"]})
    const fieldError = this.extractFieldError(error.error);
    if (fieldError) {
      return new ApiError(`${operationText}${fieldError}`, error.status, error);
    }

    // Handle HTTP status codes with meaningful messages
    const statusMessage = this.getStatusMessage(error.status);
    return new ApiError(`${operationText}${statusMessage}`, error.status, error);
  }

  /**
   * Extract field-specific error message from Django error response.
   *
   * Handles format: {"fieldname": ["error message 1", "error message 2"]}.
   *
   * @param response - Parsed error body (object or null)
   * @returns First field error string, or null if none
   */
  private static extractFieldError(response: unknown): string | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const errorObj = response as Record<string, unknown>;

    // Try to find first field with array of error messages
    for (const [key, value] of Object.entries(errorObj)) {
      // Skip special fields handled by extractDetailError
      if (key === 'non_field_errors' || key === 'detail') {
        continue;
      }

      if (Array.isArray(value) && value.length > 0) {
        const messages = value.filter((msg) => typeof msg === 'string');
        if (messages.length > 0) {
          // Format: "fieldname: error 1, error 2"
          return `${key}: ${messages.join(', ')}`;
        }
      }
    }

    return null;
  }

  /**
   * Extract non_field_errors or detail from Django error response.
   *
   * @param response - Parsed error body (object or null)
   * @returns Combined non_field_errors or detail string, or null
   */
  private static extractDetailError(response: unknown): string | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const errorObj = response as Record<string, unknown>;

    // Check for non_field_errors (validation errors that apply to multiple fields)
    if ('non_field_errors' in errorObj && Array.isArray(errorObj['non_field_errors'])) {
      const messages = (errorObj['non_field_errors'] as unknown[]).filter(
        (msg) => typeof msg === 'string'
      );
      if (messages.length > 0) {
        return messages.join(', ');
      }
    }

    // Check for detail (generic error message)
    if ('detail' in errorObj && typeof errorObj['detail'] === 'string') {
      return errorObj['detail'];
    }

    return null;
  }

  /**
   * Get user-friendly message for HTTP status codes.
   *
   * @param status - HTTP status code
   * @returns User-friendly message for known codes, or generic fallback
   */
  private static getStatusMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Your session has expired. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'This resource already exists. Please check your input.',
      422: 'Invalid data. Please check your input and try again.',
      429: 'Too many requests. Please try again later.',
      500: 'A server error occurred. Please try again later.',
      502: 'The server is temporarily unavailable. Please try again later.',
      503: 'The server is currently down. Please try again later.',
    };

    return messages[status] || 'An unexpected error occurred. Please try again.';
  }
}
