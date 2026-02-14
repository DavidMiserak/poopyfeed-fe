/**
 * Tests for FeedingsService
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FeedingsService } from './feedings.service';
import { Feeding, FeedingCreate, FeedingUpdate } from '../models/feeding.model';

describe('FeedingsService', () => {
  let service: FeedingsService;
  let httpMock: HttpTestingController;

  const mockBottleFeeding: Feeding = {
    id: 1,
    child: 1,
    feeding_type: 'bottle',
    fed_at: '2024-01-15T10:00:00Z',
    amount_oz: 4.5,
    notes: 'Baby seemed hungry',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  const mockBreastFeeding: Feeding = {
    id: 2,
    child: 1,
    feeding_type: 'breast',
    fed_at: '2024-01-15T11:00:00Z',
    duration_minutes: 15,
    side: 'both',
    notes: 'Good latch',
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  };

  const mockFeedings: Feeding[] = [mockBottleFeeding, mockBreastFeeding];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FeedingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch feedings list for a child', () => {
      service.list(1).subscribe({
        next: (feedings) => {
          expect(feedings).toEqual(mockFeedings);
          expect(feedings.length).toBe(2);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      expect(req.request.method).toBe('GET');
      req.flush({ count: mockFeedings.length, next: null, previous: null, results: mockFeedings });
    });

    it('should handle empty list', () => {
      service.list(1).subscribe({
        next: (feedings) => {
          expect(feedings).toEqual([]);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush({ count: 0, next: null, previous: null, results: [] });
    });

    it('should handle 401 unauthorized error', () => {
      let errorCaught = false;

      service.list(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('session has expired');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error', () => {
      let errorCaught = false;

      service.list(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 404 not found error', () => {
      let errorCaught = false;

      service.list(999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/999/feedings/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 500 server error', () => {
      let errorCaught = false;

      service.list(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('server error');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('get', () => {
    it('should fetch a single feeding', () => {
      service.get(1, 1).subscribe({
        next: (feeding) => {
          expect(feeding).toEqual(mockBottleFeeding);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      expect(req.request.method).toBe('GET');
      req.flush(mockBottleFeeding);
    });

    it('should handle 404 not found error', () => {
      let errorCaught = false;

      service.get(1, 999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error', () => {
      let errorCaught = false;

      service.get(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('create', () => {
    const createBottleData: FeedingCreate = {
      feeding_type: 'bottle',
      fed_at: '2024-01-15T12:00:00Z',
      amount_oz: 5.0,
      notes: 'Afternoon feeding',
    };

    const createdBottleFeeding: Feeding = {
      id: 3,
      child: 1,
      ...createBottleData,
      created_at: '2024-01-15T12:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    };

    const createBreastData: FeedingCreate = {
      feeding_type: 'breast',
      fed_at: '2024-01-15T13:00:00Z',
      duration_minutes: 20,
      side: 'left',
      notes: 'Good feeding session',
    };

    const createdBreastFeeding: Feeding = {
      id: 4,
      child: 1,
      ...createBreastData,
      created_at: '2024-01-15T13:00:00Z',
      updated_at: '2024-01-15T13:00:00Z',
    };

    it('should create a new bottle feeding', () => {
      service.create(1, createBottleData).subscribe({
        next: (feeding) => {
          expect(feeding).toEqual(createdBottleFeeding);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createBottleData);
      req.flush(createdBottleFeeding);
    });

    it('should create a new breast feeding', () => {
      service.create(1, createBreastData).subscribe({
        next: (feeding) => {
          expect(feeding).toEqual(createdBreastFeeding);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createBreastData);
      req.flush(createdBreastFeeding);
    });

    it('should handle validation errors for bottle feeding', () => {
      let errorCaught = false;

      service.create(1, createBottleData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('amount_oz');
          expect(error.message).toContain('required');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(
        { amount_oz: ['This field is required for bottle feeding'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle validation errors for breast feeding', () => {
      let errorCaught = false;

      service.create(1, createBreastData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('side');
          expect(error.message).toContain('required');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(
        { side: ['This field is required for breast feeding'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle non_field_errors', () => {
      let errorCaught = false;

      service.create(1, createBottleData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(
        { non_field_errors: ['Invalid feeding data'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error', () => {
      let errorCaught = false;

      service.create(1, createBottleData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('update', () => {
    const updateData: FeedingUpdate = {
      notes: 'Updated notes',
      amount_oz: 5.5,
    };

    const updatedFeeding: Feeding = {
      ...mockBottleFeeding,
      notes: 'Updated notes',
      amount_oz: 5.5,
      updated_at: '2024-01-15T11:00:00Z',
    };

    it('should update a feeding', () => {
      service.update(1, 1, updateData).subscribe({
        next: (feeding) => {
          expect(feeding).toEqual(updatedFeeding);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedFeeding);
    });

    it('should handle 404 error', () => {
      let errorCaught = false;

      service.update(1, 999, updateData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error', () => {
      let errorCaught = false;

      service.update(1, 1, updateData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });

    it('should handle validation errors', () => {
      let errorCaught = false;

      service.update(1, 1, updateData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('amount_oz');
          expect(error.message).toContain('positive');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(
        { amount_oz: ['Amount must be a positive number'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a feeding', () => {
      service.delete(1, 1).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle 404 error', () => {
      let errorCaught = false;

      service.delete(1, 999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error', () => {
      let errorCaught = false;

      service.delete(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle detail error response', () => {
      let errorCaught = false;

      service.get(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Custom error detail');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(
        { detail: 'Custom error detail' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 400 generic error', () => {
      let errorCaught = false;

      service.get(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid request');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
    });

    it('should handle unknown error', () => {
      let errorCaught = false;

      service.get(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('unexpected');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.error(new ProgressEvent('error'));

      expect(errorCaught).toBe(true);
    });
  });

  describe('network errors', () => {
    it('should handle network offline error on list()', () => {
      let errorCaught = false;

      service.list(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'Unknown Error',
      });

      expect(errorCaught).toBe(true);
    });

    it('should handle network timeout on get()', () => {
      let errorCaught = false;

      service.get(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.error(new ProgressEvent('timeout'), {
        status: 0,
        statusText: 'Timeout',
      });

      expect(errorCaught).toBe(true);
    });

    it('should handle connection refused on create()', () => {
      let errorCaught = false;

      service.create(1, { feeding_type: 'bottle', fed_at: '2024-01-20T12:00:00Z', amount_oz: 5 }).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'Connection refused',
      });

      expect(errorCaught).toBe(true);
    });

    it('should handle CORS failure on update()', () => {
      let errorCaught = false;

      service.update(1, 1, { notes: 'Updated' }).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'CORS error',
      });

      expect(errorCaught).toBe(true);
    });

    it('should handle DNS failure on delete()', () => {
      let errorCaught = false;

      service.delete(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'DNS lookup failed',
      });

      expect(errorCaught).toBe(true);
    });
  });

  describe('malformed responses', () => {
    it('should handle null error response on 400 error', () => {
      let errorCaught = false;

      service.get(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
    });

    it('should handle empty error object on validation error', () => {
      let errorCaught = false;

      service.create(1, { feeding_type: 'bottle', fed_at: '2024-01-20T12:00:00Z', amount_oz: 5 }).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid request');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
    });

    it('should handle null error response on server error', () => {
      let errorCaught = false;

      service.list(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('server error');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('HTTP error codes', () => {
    it('should handle 429 rate limit error on list()', () => {
      let errorCaught = false;

      service.list(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Too many requests');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush({}, { status: 429, statusText: 'Too Many Requests' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 422 unprocessable entity on create()', () => {
      let errorCaught = false;

      service.create(1, { feeding_type: 'bottle', fed_at: '2024-01-20T12:00:00Z', amount_oz: 5 }).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid data');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush({}, { status: 422, statusText: 'Unprocessable Entity' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 502 bad gateway error on get()', () => {
      let errorCaught = false;

      service.get(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('temporarily unavailable');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null, { status: 502, statusText: 'Bad Gateway' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 503 service unavailable on list()', () => {
      let errorCaught = false;

      service.list(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('server is currently down');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(null, { status: 503, statusText: 'Service Unavailable' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 504 gateway timeout on delete()', () => {
      let errorCaught = false;

      service.delete(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('unexpected error');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null, { status: 504, statusText: 'Gateway Timeout' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 401 unauthorized on create()', () => {
      let errorCaught = false;

      service.create(1, { feeding_type: 'bottle', fed_at: '2024-01-20T12:00:00Z', amount_oz: 5 }).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('session has expired');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 401 unauthorized on update()', () => {
      let errorCaught = false;

      service.update(1, 1, { notes: 'Updated' }).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('session has expired');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 409 conflict error on update()', () => {
      let errorCaught = false;

      service.update(1, 1, { notes: 'Conflicting update' }).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('already exists');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null, { status: 409, statusText: 'Conflict' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('state consistency on errors', () => {
    it('should not add feeding to cache on create error', () => {
      const initialFeedings = [...mockFeedings];
      service.feedings.set(initialFeedings);

      service.create(1, { feeding_type: 'bottle', fed_at: '2024-01-20T12:00:00Z', amount_oz: -1 }).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(
        { amount_oz: ['Must be positive'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(service.feedings()).toEqual(initialFeedings);
    });

    it('should not remove from cache on delete error', () => {
      const initialFeedings = [...mockFeedings];
      service.feedings.set(initialFeedings);

      service.delete(1, 999).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(service.feedings()).toEqual(initialFeedings);
    });

    it('should not modify cache on update error', () => {
      const initialFeedings = [...mockFeedings];
      service.feedings.set(initialFeedings);

      const originalAmount = mockBottleFeeding.amount_oz;

      service.update(1, 1, { amount_oz: -5 }).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(
        { amount_oz: ['Must be positive'] },
        { status: 400, statusText: 'Bad Request' }
      );

      const cachedFeeding = service.feedings().find((f: Feeding) => f.id === 1);
      expect(cachedFeeding?.amount_oz).toBe(originalAmount);
    });
  });

  describe('retry scenarios', () => {
    it('should allow retry after create() error', () => {
      let firstErrorCaught = false;
      let secondSuccessCaught = false;

      const createData: FeedingCreate = { feeding_type: 'bottle', fed_at: '2024-01-20T12:00:00Z', amount_oz: 5 };
      const createdFeeding: Feeding = {
        id: 5,
        child: 1,
        ...createData,
        created_at: '2024-01-20T12:00:00Z',
        updated_at: '2024-01-20T12:00:00Z',
      };

      // First request - fails
      service.create(1, createData).subscribe({
        error: () => {
          firstErrorCaught = true;
        },
      });

      let req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(firstErrorCaught).toBe(true);

      // Retry - succeeds
      service.create(1, createData).subscribe({
        next: (feeding: Feeding) => {
          expect(feeding).toEqual(createdFeeding);
          secondSuccessCaught = true;
        },
      });

      req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(createdFeeding);

      expect(secondSuccessCaught).toBe(true);
    });

    it('should maintain cache after failed delete retry', () => {
      service.feedings.set([...mockFeedings]);
      const initialLength = service.feedings().length;

      // First request - fails
      service.delete(1, 1).subscribe({
        error: () => {
          // Error expected
        },
      });

      let req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      // Verify cache unchanged
      expect(service.feedings().length).toBe(initialLength);

      // Retry - succeeds
      service.delete(1, 1).subscribe();

      req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null);

      expect(service.feedings().length).toBe(initialLength - 1);
    });
  });

  describe('state management', () => {
    it('should update feedings cache when creating', () => {
      const newFeeding: Feeding = {
        id: 99,
        child: 1,
        feeding_type: 'bottle',
        fed_at: '2024-01-20T12:00:00Z',
        amount_oz: 5,
        notes: 'New feeding',
        created_at: '2024-01-20T12:00:00Z',
        updated_at: '2024-01-20T12:00:00Z',
      };

      service.feedings.set(mockFeedings);
      expect(service.feedings().length).toBe(2);

      service.create(1, { feeding_type: 'bottle', fed_at: '2024-01-20T12:00:00Z', amount_oz: 5 }).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(newFeeding);

      expect(service.feedings().length).toBe(3);
    });

    it('should remove feeding from cache when deleting', () => {
      service.feedings.set(mockFeedings);
      expect(service.feedings().length).toBe(2);

      service.delete(1, 1).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(null);

      expect(service.feedings().length).toBe(1);
      expect(service.feedings()[0].id).toBe(2);
    });

    it('should update feeding in cache when updating', () => {
      service.feedings.set(mockFeedings);
      const updatedFeeding = { ...mockBottleFeeding, amount_oz: 6 };

      service.update(1, 1, { feeding_type: 'bottle', fed_at: mockBottleFeeding.fed_at, amount_oz: 6 }).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/feedings/1/');
      req.flush(updatedFeeding);

      const cachedFeeding = service.feedings().find(f => f.id === 1);
      expect(cachedFeeding?.amount_oz).toBe(6);
    });

    it('should handle deletion when feeding not found in cache', () => {
      service.feedings.set([mockBreastFeeding]);

      service.delete(1, 999).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/feedings/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      // Only mockBreastFeeding should remain
      expect(service.feedings()[0].id).toBe(2);
    });

    it('should initialize with empty feedings signal', () => {
      expect(service.feedings()).toEqual([]);
    });

    it('should maintain cache after multiple operations', () => {
      service.feedings.set(mockFeedings);
      expect(service.feedings().length).toBe(2);

      const newFeeding: Feeding = {
        ...mockBottleFeeding,
        id: 3,
      };

      service.create(1, { feeding_type: 'bottle', fed_at: '2024-01-20T12:00:00Z', amount_oz: 5 }).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/feedings/');
      req.flush(newFeeding);

      expect(service.feedings().length).toBe(3);
      expect(service.feedings()[2].id).toBe(3);
    });
  });
});
