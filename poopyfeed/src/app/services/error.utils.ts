import { HttpErrorResponse } from '@angular/common/http';

/**
 * Custom error class for API-related errors
 * Contains both user-friendly message and detailed error information
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if error is due to authentication failure
   */
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Check if error is due to not found
   */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Check if error is due to validation failure
   */
  isValidationError(): boolean {
    return this.status === 400;
  }

  /**
   * Check if error is due to conflict (e.g., duplicate entry)
   */
  isConflictError(): boolean {
    return this.status === 409;
  }

  /**
   * Check if error is due to server error
   */
  isServerError(): boolean {
    return this.status ? this.status >= 500 : false;
  }
}

/**
 * Error handler utility for standardizing error handling across all services
 * Converts HTTP errors and other errors into user-friendly messages
 */
export class ErrorHandler {
  /**
   * Handle HTTP error responses and return a user-friendly ApiError
   * Supports various Django error response formats
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
   * Handle HTTP error responses with support for Django error formats
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
   * Extract field-specific error message from Django error response
   * Handles format: {"fieldname": ["error message 1", "error message 2"]}
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
   * Extract non_field_errors or detail from Django error response
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
   * Get user-friendly message for HTTP status codes
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
