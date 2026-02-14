/**
 * Tests for DiapersService
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DiapersService } from './diapers.service';
import {
  DiaperChange,
  DiaperChangeCreate,
  DiaperChangeUpdate,
} from '../models/diaper.model';

describe('DiapersService', () => {
  let service: DiapersService;
  let httpMock: HttpTestingController;

  const mockWetDiaper: DiaperChange = {
    id: 1,
    child: 1,
    change_type: 'wet',
    changed_at: '2024-01-15T10:00:00Z',
    notes: 'Morning change',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  const mockDirtyDiaper: DiaperChange = {
    id: 2,
    child: 1,
    change_type: 'dirty',
    changed_at: '2024-01-15T11:00:00Z',
    notes: 'Poop',
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  };

  const mockBothDiaper: DiaperChange = {
    id: 3,
    child: 1,
    change_type: 'both',
    changed_at: '2024-01-15T12:00:00Z',
    notes: 'Both wet and dirty',
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
  };

  const mockDiapers: DiaperChange[] = [
    mockWetDiaper,
    mockDirtyDiaper,
    mockBothDiaper,
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    service = TestBed.inject(DiapersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch diapers list for a child', () => {
      service.list(1).subscribe({
        next: (diapers) => {
          expect(diapers).toEqual(mockDiapers);
          expect(diapers.length).toBe(3);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
      expect(req.request.method).toBe('GET');
      req.flush({ count: mockDiapers.length, next: null, previous: null, results: mockDiapers });
    });

    it('should handle empty list', () => {
      service.list(1).subscribe({
        next: (diapers) => {
          expect(diapers).toEqual([]);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
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

      const req = httpMock.expectOne('/api/v1/children/999/diapers/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('get', () => {
    it('should fetch a single diaper change', () => {
      service.get(1, 1).subscribe({
        next: (diaper) => {
          expect(diaper).toEqual(mockWetDiaper);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
      expect(req.request.method).toBe('GET');
      req.flush(mockWetDiaper);
    });

    it('should handle 404 not found error', () => {
      let errorCaught = false;

      service.get(1, 999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/999/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('create', () => {
    const createWetData: DiaperChangeCreate = {

      change_type: 'wet',
      changed_at: '2024-01-15T13:00:00Z',
      notes: 'Afternoon wet diaper',
    };

    const createdWetDiaper: DiaperChange = {
      id: 4,
      child: 1,
      ...createWetData,
      created_at: '2024-01-15T13:00:00Z',
      updated_at: '2024-01-15T13:00:00Z',
    };

    const createDirtyData: DiaperChangeCreate = {

      change_type: 'dirty',
      changed_at: '2024-01-15T14:00:00Z',
      notes: 'Afternoon poop',
    };

    const createdDirtyDiaper: DiaperChange = {
      id: 5,
      child: 1,
      ...createDirtyData,
      created_at: '2024-01-15T14:00:00Z',
      updated_at: '2024-01-15T14:00:00Z',
    };

    const createBothData: DiaperChangeCreate = {

      change_type: 'both',
      changed_at: '2024-01-15T15:00:00Z',
      notes: 'Both wet and dirty',
    };

    const createdBothDiaper: DiaperChange = {
      id: 6,
      child: 1,
      ...createBothData,
      created_at: '2024-01-15T15:00:00Z',
      updated_at: '2024-01-15T15:00:00Z',
    };

    it('should create a new wet diaper change', () => {
      service.create(1, createWetData).subscribe({
        next: (diaper) => {
          expect(diaper).toEqual(createdWetDiaper);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createWetData);
      req.flush(createdWetDiaper);
    });

    it('should create a new dirty diaper change', () => {
      service.create(1, createDirtyData).subscribe({
        next: (diaper) => {
          expect(diaper).toEqual(createdDirtyDiaper);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDirtyData);
      req.flush(createdDirtyDiaper);
    });

    it('should create a new both diaper change', () => {
      service.create(1, createBothData).subscribe({
        next: (diaper) => {
          expect(diaper).toEqual(createdBothDiaper);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createBothData);
      req.flush(createdBothDiaper);
    });

    it('should handle validation errors', () => {
      let errorCaught = false;

      service.create(1, createWetData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('change_type');
          expect(error.message).toContain('required');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
      req.flush(
        { change_type: ['This field is required'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle non_field_errors', () => {
      let errorCaught = false;

      service.create(1, createWetData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
      req.flush(
        { non_field_errors: ['Invalid diaper change data'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error', () => {
      let errorCaught = false;

      service.create(1, createWetData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('update', () => {
    const updateData: DiaperChangeUpdate = {
      notes: 'Updated notes',
      change_type: 'both',
    };

    const updatedDiaper: DiaperChange = {
      ...mockWetDiaper,
      notes: 'Updated notes',
      change_type: 'both',
      updated_at: '2024-01-15T11:00:00Z',
    };

    it('should update a diaper change', () => {
      service.update(1, 1, updateData).subscribe({
        next: (diaper) => {
          expect(diaper).toEqual(updatedDiaper);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedDiaper);
    });

    it('should handle 404 error', () => {
      let errorCaught = false;

      service.update(1, 999, updateData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/999/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });

    it('should handle validation errors', () => {
      let errorCaught = false;

      service.update(1, 1, updateData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('change_type');
          expect(error.message).toContain('Invalid');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
      req.flush(
        { change_type: ['Invalid change type'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a diaper change', () => {
      service.delete(1, 1).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/999/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/');
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

      const req = httpMock.expectOne('/api/v1/children/1/diapers/1/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });
});
