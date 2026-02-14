/**
 * Tests for NapsService
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NapsService } from './naps.service';
import { Nap, NapCreate, NapUpdate } from '../models/nap.model';

describe('NapsService', () => {
  let service: NapsService;
  let httpMock: HttpTestingController;

  const mockNap1: Nap = {
    id: 1,
    child: 1,
    napped_at: '2024-01-15T10:00:00Z',
    ended_at: '2024-01-15T12:00:00Z',
    duration_minutes: 120,
    notes: 'Good nap, 2 hours',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  const mockNap2: Nap = {
    id: 2,
    child: 1,
    napped_at: '2024-01-15T14:00:00Z',
    ended_at: '2024-01-15T14:30:00Z',
    duration_minutes: 30,
    notes: 'Short afternoon nap',
    created_at: '2024-01-15T14:00:00Z',
    updated_at: '2024-01-15T14:00:00Z',
  };

  const mockNap3: Nap = {
    id: 3,
    child: 1,
    napped_at: '2024-01-15T18:00:00Z',
    ended_at: null,
    duration_minutes: null,
    created_at: '2024-01-15T18:00:00Z',
    updated_at: '2024-01-15T18:00:00Z',
  };

  const mockNaps: Nap[] = [mockNap1, mockNap2, mockNap3];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NapsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch naps list for a child', () => {
      service.list(1).subscribe({
        next: (naps) => {
          expect(naps).toEqual(mockNaps);
          expect(naps.length).toBe(3);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/');
      expect(req.request.method).toBe('GET');
      req.flush({ count: mockNaps.length, next: null, previous: null, results: mockNaps });
    });

    it('should handle empty list', () => {
      service.list(1).subscribe({
        next: (naps) => {
          expect(naps).toEqual([]);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/');
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

      const req = httpMock.expectOne('/api/v1/children/1/naps/');
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

      const req = httpMock.expectOne('/api/v1/children/1/naps/');
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

      const req = httpMock.expectOne('/api/v1/children/999/naps/');
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

      const req = httpMock.expectOne('/api/v1/children/1/naps/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('get', () => {
    it('should fetch a single nap', () => {
      service.get(1, 1).subscribe({
        next: (nap) => {
          expect(nap).toEqual(mockNap1);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
      expect(req.request.method).toBe('GET');
      req.flush(mockNap1);
    });

    it('should handle 404 not found error', () => {
      let errorCaught = false;

      service.get(1, 999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/999/');
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

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('create', () => {
    const createData: NapCreate = {

      napped_at: '2024-01-15T20:00:00Z',
      notes: 'Evening nap',
    };

    const createdNap: Nap = {
      id: 4,
      child: 1,
      ...createData,
      ended_at: null,
      duration_minutes: null,
      created_at: '2024-01-15T20:00:00Z',
      updated_at: '2024-01-15T20:00:00Z',
    };

    it('should create a new nap', () => {
      service.create(1, createData).subscribe({
        next: (nap) => {
          expect(nap).toEqual(createdNap);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createData);
      req.flush(createdNap);
    });

    it('should handle validation errors', () => {
      let errorCaught = false;

      service.create(1, createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('napped_at');
          expect(error.message).toContain('required');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/');
      req.flush(
        { napped_at: ['This field is required'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle non_field_errors', () => {
      let errorCaught = false;

      service.create(1, createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/');
      req.flush(
        { non_field_errors: ['Invalid nap data'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error', () => {
      let errorCaught = false;

      service.create(1, createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('update', () => {
    const updateData: NapUpdate = {
      notes: 'Updated notes - longer nap than expected',
    };

    const updatedNap: Nap = {
      ...mockNap1,
      notes: 'Updated notes - longer nap than expected',
      updated_at: '2024-01-15T11:00:00Z',
    };

    it('should update a nap', () => {
      service.update(1, 1, updateData).subscribe({
        next: (nap) => {
          expect(nap).toEqual(updatedNap);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedNap);
    });

    it('should handle 404 error', () => {
      let errorCaught = false;

      service.update(1, 999, updateData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/999/');
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

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });

    it('should handle validation errors', () => {
      let errorCaught = false;

      service.update(1, 1, updateData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('napped_at');
          expect(error.message).toContain('valid');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
      req.flush(
        { napped_at: ['Enter a valid date/time'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a nap', () => {
      service.delete(1, 1).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
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

      const req = httpMock.expectOne('/api/v1/children/1/naps/999/');
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

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
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

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
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

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
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

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
      req.error(new ProgressEvent('error'));

      expect(errorCaught).toBe(true);
    });
  });

  describe('malformed responses', () => {
    it('should handle null error response on validation error', () => {
      let errorCaught = false;

      service.list(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid request');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
    });

    it('should handle null error response on get()', () => {
      let errorCaught = false;

      service.get(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/naps/1/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });
});
