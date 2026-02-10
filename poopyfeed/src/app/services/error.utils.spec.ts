import { describe, it, expect } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, ErrorHandler } from './error.utils';

describe('ApiError', () => {
  it('should create an ApiError with message', () => {
    const error = new ApiError('Test error', 400);
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(400);
    expect(error.name).toBe('ApiError');
  });

  it('should identify auth errors (401)', () => {
    const error = new ApiError('Unauthorized', 401);
    expect(error.isAuthError()).toBe(true);
  });

  it('should identify auth errors (403)', () => {
    const error = new ApiError('Forbidden', 403);
    expect(error.isAuthError()).toBe(true);
  });

  it('should identify not found errors (404)', () => {
    const error = new ApiError('Not found', 404);
    expect(error.isNotFoundError()).toBe(true);
  });

  it('should identify validation errors (400)', () => {
    const error = new ApiError('Validation error', 400);
    expect(error.isValidationError()).toBe(true);
  });

  it('should identify conflict errors (409)', () => {
    const error = new ApiError('Conflict', 409);
    expect(error.isConflictError()).toBe(true);
  });

  it('should identify server errors (5xx)', () => {
    const error500 = new ApiError('Server error', 500);
    const error503 = new ApiError('Service unavailable', 503);
    expect(error500.isServerError()).toBe(true);
    expect(error503.isServerError()).toBe(true);
  });
});

describe('ErrorHandler', () => {
  describe('handle() - general error types', () => {
    it('should handle HttpErrorResponse', () => {
      const httpError = new HttpErrorResponse({
        error: { detail: 'Not found' },
        status: 404,
        statusText: 'Not Found',
      });
      const result = ErrorHandler.handle(httpError);
      expect(result).toBeInstanceOf(ApiError);
      expect(result.status).toBe(404);
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.handle(error);
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Test error');
    });

    it('should handle string errors', () => {
      const result = ErrorHandler.handle('String error');
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('String error');
    });

    it('should handle object errors with message property', () => {
      const result = ErrorHandler.handle({ message: 'Object error' });
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Object error');
    });

    it('should handle unknown errors', () => {
      const result = ErrorHandler.handle({});
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('An unexpected error occurred');
    });

    it('should include operation in error message', () => {
      const error = new Error('Network error');
      const result = ErrorHandler.handle(error, 'Load children');
      expect(result.message).toBe('Load children: Network error');
    });
  });

  describe('handle() - field-specific errors', () => {
    it('should extract field-specific errors from Django response', () => {
      const httpError = new HttpErrorResponse({
        error: { name: ['This field is required'] },
        status: 400,
        statusText: 'Bad Request',
      });
      const result = ErrorHandler.handle(httpError);
      expect(result.message).toContain('name:');
      expect(result.message).toContain('This field is required');
    });

    it('should handle multiple error messages for same field', () => {
      const httpError = new HttpErrorResponse({
        error: { age: ['Must be positive', 'Must be less than 150'] },
        status: 400,
        statusText: 'Bad Request',
      });
      const result = ErrorHandler.handle(httpError);
      expect(result.message).toContain('age:');
      expect(result.message).toContain('Must be positive');
      expect(result.message).toContain('Must be less than 150');
    });

    it('should skip non_field_errors and detail in field extraction', () => {
      const httpError = new HttpErrorResponse({
        error: {
          non_field_errors: ['Non-field error'],
          detail: 'Detail message',
          email: ['Invalid email'],
        },
        status: 400,
        statusText: 'Bad Request',
      });
      const result = ErrorHandler.handle(httpError);
      // Should prioritize non_field_errors/detail over field errors
      expect(result.message).toContain('Non-field error');
    });
  });

  describe('handle() - non_field_errors', () => {
    it('should extract non_field_errors from Django response', () => {
      const httpError = new HttpErrorResponse({
        error: { non_field_errors: ['This email is already registered'] },
        status: 400,
        statusText: 'Bad Request',
      });
      const result = ErrorHandler.handle(httpError);
      expect(result.message).toContain('This email is already registered');
    });

    it('should handle multiple non_field_errors', () => {
      const httpError = new HttpErrorResponse({
        error: {
          non_field_errors: ['Error 1', 'Error 2', 'Error 3'],
        },
        status: 400,
        statusText: 'Bad Request',
      });
      const result = ErrorHandler.handle(httpError);
      expect(result.message).toContain('Error 1');
      expect(result.message).toContain('Error 2');
      expect(result.message).toContain('Error 3');
    });
  });

  describe('handle() - detail messages', () => {
    it('should extract detail from response', () => {
      const httpError = new HttpErrorResponse({
        error: { detail: 'Resource not found' },
        status: 404,
        statusText: 'Not Found',
      });
      const result = ErrorHandler.handle(httpError);
      expect(result.message).toContain('Resource not found');
    });

    it('should prioritize detail over HTTP status message', () => {
      const httpError = new HttpErrorResponse({
        error: { detail: 'Custom not found message' },
        status: 404,
        statusText: 'Not Found',
      });
      const result = ErrorHandler.handle(httpError);
      expect(result.message).toBe('Custom not found message');
    });
  });

  describe('handle() - HTTP status codes', () => {
    const testCases = [
      { status: 400, expectedInclude: 'Invalid request' },
      { status: 401, expectedInclude: 'session has expired' },
      { status: 403, expectedInclude: 'do not have permission' },
      { status: 404, expectedInclude: 'not found' },
      { status: 409, expectedInclude: 'already exists' },
      { status: 422, expectedInclude: 'Invalid data' },
      { status: 429, expectedInclude: 'Too many requests' },
      { status: 500, expectedInclude: 'server error' },
      { status: 502, expectedInclude: 'temporarily unavailable' },
      { status: 503, expectedInclude: 'currently down' },
    ];

    testCases.forEach(({ status, expectedInclude }) => {
      it(`should provide message for ${status} status`, () => {
        const httpError = new HttpErrorResponse({
          error: {},
          status,
          statusText: 'Error',
        });
        const result = ErrorHandler.handle(httpError);
        expect(result.message.toLowerCase()).toContain(expectedInclude.toLowerCase());
      });
    });

    it('should provide generic message for unknown status', () => {
      const httpError = new HttpErrorResponse({
        error: {},
        status: 418, // I'm a teapot
        statusText: 'I\'m a teapot',
      });
      const result = ErrorHandler.handle(httpError);
      expect(result.message).toContain('unexpected error');
    });
  });
});

describe('ApiError - isServerError edge cases', () => {
  it('should return false when status is undefined', () => {
    const error = new ApiError('Test error');
    expect(error.isServerError()).toBe(false);
  });

  it('should return false for non-server error codes', () => {
    const error = new ApiError('Test error', 400);
    expect(error.isServerError()).toBe(false);
  });

  it('should return true for exactly 500', () => {
    const error = new ApiError('Test error', 500);
    expect(error.isServerError()).toBe(true);
  });

  it('should return true for 599', () => {
    const error = new ApiError('Test error', 599);
    expect(error.isServerError()).toBe(true);
  });

  it('should return false for 499', () => {
    const error = new ApiError('Test error', 499);
    expect(error.isServerError()).toBe(false);
  });
});

describe('ErrorHandler - edge cases with malformed responses', () => {
  it('should handle response with null error', () => {
    const httpError = new HttpErrorResponse({
      error: null,
      status: 400,
      statusText: 'Bad Request',
    });
    const result = ErrorHandler.handle(httpError);
    expect(result).toBeInstanceOf(ApiError);
    expect(result.message).toContain('Invalid request');
  });

  it('should handle response with undefined error', () => {
    const httpError = new HttpErrorResponse({
      error: undefined,
      status: 500,
      statusText: 'Server Error',
    });
    const result = ErrorHandler.handle(httpError);
    expect(result).toBeInstanceOf(ApiError);
    expect(result.message).toContain('server error');
  });

  it('should handle non_field_errors with empty array', () => {
    const httpError = new HttpErrorResponse({
      error: { non_field_errors: [] },
      status: 400,
      statusText: 'Bad Request',
    });
    const result = ErrorHandler.handle(httpError);
    expect(result).toBeInstanceOf(ApiError);
    expect(result.message).toContain('Invalid request');
  });

  it('should handle field errors with empty array', () => {
    const httpError = new HttpErrorResponse({
      error: { email: [] },
      status: 400,
      statusText: 'Bad Request',
    });
    const result = ErrorHandler.handle(httpError);
    expect(result).toBeInstanceOf(ApiError);
    expect(result.message).toContain('Invalid request');
  });

  it('should handle field errors with non-string values', () => {
    const httpError = new HttpErrorResponse({
      error: { age: [123, { value: 'error' }] },
      status: 400,
      statusText: 'Bad Request',
    });
    const result = ErrorHandler.handle(httpError);
    expect(result).toBeInstanceOf(ApiError);
    // Should fall through to HTTP status message since no string errors
    expect(result.message).toContain('Invalid request');
  });

  it('should handle object error with detail property', () => {
    const result = ErrorHandler.handle({ detail: 'Custom error detail' });
    expect(result).toBeInstanceOf(ApiError);
    expect(result.message).toContain('Custom error detail');
  });

  it('should handle null token status', () => {
    const error = new ApiError('Test', null as unknown as number);
    expect(error.isServerError()).toBe(false);
  });
});
