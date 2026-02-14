/**
 * Tests for ChildrenService
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ChildrenService } from './children.service';
import { Child, ChildCreate, ChildUpdate } from '../models/child.model';

describe('ChildrenService', () => {
  let service: ChildrenService;
  let httpMock: HttpTestingController;

  const mockChild: Child = {
    id: 1,
    name: 'Baby Alice',
    date_of_birth: '2024-01-15',
    gender: 'F',
    user_role: 'owner',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_diaper_change: '2024-01-15T14:30:00Z',
    last_nap: '2024-01-15T13:00:00Z',
    last_feeding: '2024-01-15T12:00:00Z',
  };

  const mockChildren: Child[] = [
    mockChild,
    {
      id: 2,
      name: 'Baby Bob',
      date_of_birth: '2024-02-20',
      gender: 'M',
      user_role: 'co-parent',
      created_at: '2024-02-20T10:00:00Z',
      updated_at: '2024-02-20T10:00:00Z',
      last_diaper_change: null,
      last_nap: null,
      last_feeding: null,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChildrenService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch children list', () => {
      service.list().subscribe({
        next: (children) => {
          expect(children).toEqual(mockChildren);
          expect(children.length).toBe(2);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      expect(req.request.method).toBe('GET');
      req.flush({ count: mockChildren.length, next: null, previous: null, results: mockChildren });
    });

    it('should update children signal on successful fetch', () => {
      service.list().subscribe({
        next: () => {
          expect(service.children()).toEqual(mockChildren);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush({ count: mockChildren.length, next: null, previous: null, results: mockChildren });
    });

    it('should handle empty list', () => {
      service.list().subscribe({
        next: (children) => {
          expect(children).toEqual([]);
          expect(service.children()).toEqual([]);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush({ count: 0, next: null, previous: null, results: [] });
    });

    it('should handle 401 unauthorized error', () => {
      let errorCaught = false;

      service.list().subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('session has expired');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 500 server error', () => {
      let errorCaught = false;

      service.list().subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('server error');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('get', () => {
    it('should fetch a single child', () => {
      service.get(1).subscribe({
        next: (child) => {
          expect(child).toEqual(mockChild);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      expect(req.request.method).toBe('GET');
      req.flush(mockChild);
    });

    it('should update selectedChild signal', () => {
      service.get(1).subscribe({
        next: () => {
          expect(service.selectedChild()).toEqual(mockChild);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(mockChild);
    });

    it('should handle 404 not found error', () => {
      let errorCaught = false;

      service.get(999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error', () => {
      let errorCaught = false;

      service.get(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('create', () => {
    const createData: ChildCreate = {
      name: 'Baby Charlie',
      date_of_birth: '2024-03-01',
      gender: 'M',
    };

    const createdChild: Child = {
      id: 3,
      ...createData,
      user_role: 'owner',
      created_at: '2024-03-01T10:00:00Z',
      updated_at: '2024-03-01T10:00:00Z',
      last_diaper_change: null,
      last_nap: null,
      last_feeding: null,
    };

    it('should create a new child', () => {
      service.create(createData).subscribe({
        next: (child) => {
          expect(child).toEqual(createdChild);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createData);
      req.flush(createdChild);
    });

    it('should add created child to children signal', () => {
      // Set initial children
      service.children.set([mockChild]);

      service.create(createData).subscribe({
        next: () => {
          const children = service.children();
          expect(children.length).toBe(2);
          expect(children[1]).toEqual(createdChild);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(createdChild);
    });

    it('should handle validation errors', () => {
      let errorCaught = false;

      service.create(createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('name');
          expect(error.message).toContain('required');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(
        { name: ['This field is required'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle non_field_errors', () => {
      let errorCaught = false;

      service.create(createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(
        { non_field_errors: ['Invalid data provided'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('update', () => {
    const updateData: ChildUpdate = {
      name: 'Baby Alice Updated',
    };

    const updatedChild: Child = {
      ...mockChild,
      name: 'Baby Alice Updated',
      updated_at: '2024-01-16T10:00:00Z',
    };

    it('should update a child', () => {
      service.update(1, updateData).subscribe({
        next: (child) => {
          expect(child).toEqual(updatedChild);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedChild);
    });

    it('should update child in children signal', () => {
      // Set initial children
      service.children.set([...mockChildren]);

      service.update(1, updateData).subscribe({
        next: () => {
          const children = service.children();
          expect(children[0]).toEqual(updatedChild);
          expect(children[1]).toEqual(mockChildren[1]);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(updatedChild);
    });

    it('should update selectedChild signal if it matches', () => {
      service.selectedChild.set(mockChild);

      service.update(1, updateData).subscribe({
        next: () => {
          expect(service.selectedChild()).toEqual(updatedChild);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(updatedChild);
    });

    it('should not update selectedChild signal if different child', () => {
      service.selectedChild.set(mockChildren[1]);

      service.update(1, updateData).subscribe({
        next: () => {
          expect(service.selectedChild()).toEqual(mockChildren[1]);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(updatedChild);
    });

    it('should handle 404 error', () => {
      let errorCaught = false;

      service.update(999, updateData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a child', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should remove deleted child from children signal', () => {
      // Set initial children
      service.children.set([...mockChildren]);

      service.delete(1).subscribe({
        next: () => {
          const children = service.children();
          expect(children.length).toBe(1);
          expect(children[0].id).toBe(2);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null);
    });

    it('should clear selectedChild signal if it was deleted', () => {
      service.selectedChild.set(mockChild);

      service.delete(1).subscribe({
        next: () => {
          expect(service.selectedChild()).toBeNull();
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null);
    });

    it('should not clear selectedChild if different child deleted', () => {
      service.selectedChild.set(mockChildren[1]);

      service.delete(1).subscribe({
        next: () => {
          expect(service.selectedChild()).toEqual(mockChildren[1]);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null);
    });

    it('should handle 404 error', () => {
      let errorCaught = false;

      service.delete(999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error', () => {
      let errorCaught = false;

      service.delete(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle detail error response', () => {
      let errorCaught = false;

      service.get(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Custom error detail');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(
        { detail: 'Custom error detail' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 400 generic error', () => {
      let errorCaught = false;

      service.get(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid request. Please check ');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
    });

    it('should handle unknown error', () => {
      let errorCaught = false;

      service.get(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Get child: An unexpected error');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.error(new ProgressEvent('error'));

      expect(errorCaught).toBe(true);
    });
  });

  describe('network errors', () => {
    it('should handle network offline error on list()', () => {
      let errorCaught = false;

      service.list().subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'Unknown Error',
      });

      expect(errorCaught).toBe(true);
    });

    it('should handle network timeout on list()', () => {
      let errorCaught = false;

      service.list().subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.error(new ProgressEvent('timeout'), {
        status: 0,
        statusText: 'Timeout',
      });

      expect(errorCaught).toBe(true);
    });

    it('should handle DNS resolution failure on get()', () => {
      let errorCaught = false;

      service.get(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'DNS lookup failed',
      });

      expect(errorCaught).toBe(true);
    });

    it('should handle connection refused on create()', () => {
      let errorCaught = false;

      const createData: ChildCreate = {
        name: 'Baby Test',
        date_of_birth: '2024-03-01',
        gender: 'M',
      };

      service.create(createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'Connection refused',
      });

      expect(errorCaught).toBe(true);
    });

    it('should handle CORS preflight failure on update()', () => {
      let errorCaught = false;

      const updateData: ChildUpdate = {
        name: 'Updated Name',
      };

      service.update(1, updateData).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'CORS error',
      });

      expect(errorCaught).toBe(true);
    });
  });

  describe('malformed responses', () => {
    it('should handle null error response on 400 error', () => {
      let errorCaught = false;

      service.get(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
    });

    it('should handle empty error object on validation error', () => {
      let errorCaught = false;

      const createData: ChildCreate = {
        name: 'Baby Test',
        date_of_birth: '2024-03-01',
        gender: 'M',
      };

      service.create(createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid request');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
    });

    it('should handle null error response on server error', () => {
      let errorCaught = false;

      service.get(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('server error');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('HTTP error codes', () => {
    it('should handle 429 rate limit error on list()', () => {
      let errorCaught = false;

      service.list().subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Too many requests');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush({}, { status: 429, statusText: 'Too Many Requests' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 422 unprocessable entity on create()', () => {
      let errorCaught = false;

      const createData: ChildCreate = {
        name: 'Baby Test',
        date_of_birth: '2024-03-01',
        gender: 'M',
      };

      service.create(createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid data');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush({}, { status: 422, statusText: 'Unprocessable Entity' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 502 bad gateway error on get()', () => {
      let errorCaught = false;

      service.get(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('temporarily unavailable');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null, { status: 502, statusText: 'Bad Gateway' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 503 service unavailable on list()', () => {
      let errorCaught = false;

      service.list().subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('server is currently down');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(null, { status: 503, statusText: 'Service Unavailable' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 504 gateway timeout on create()', () => {
      let errorCaught = false;

      const createData: ChildCreate = {
        name: 'Baby Test',
        date_of_birth: '2024-03-01',
        gender: 'M',
      };

      service.create(createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('unexpected error');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(null, { status: 504, statusText: 'Gateway Timeout' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 507 insufficient storage on delete()', () => {
      let errorCaught = false;

      service.delete(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null, { status: 507, statusText: 'Insufficient Storage' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('permission errors', () => {
    it('should handle 403 forbidden on create()', () => {
      let errorCaught = false;

      const createData: ChildCreate = {
        name: 'Baby Test',
        date_of_birth: '2024-03-01',
        gender: 'M',
      };

      service.create(createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden on update()', () => {
      let errorCaught = false;

      const updateData: ChildUpdate = {
        name: 'Updated Name',
      };

      service.update(1, updateData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('validation errors', () => {
    it('should handle multiple field validation errors', () => {
      let errorCaught = false;

      const createData: ChildCreate = {
        name: '',
        date_of_birth: 'invalid-date',
        gender: 'O',
      };

      service.create(createData).subscribe({
        error: (error: Error) => {
          // ErrorHandler returns only first field with error
          expect(error.message).toContain('name');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(
        {
          name: ['This field is required'],
          date_of_birth: ['Invalid date format'],
        },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle mixed field and non_field errors', () => {
      let errorCaught = false;

      const createData: ChildCreate = {
        name: 'Baby Test',
        date_of_birth: '2024-03-01',
        gender: 'M',
      };

      service.create(createData).subscribe({
        error: (error: Error) => {
          // ErrorHandler prioritizes non_field_errors over field errors
          expect(error.message).toContain('Duplicate child detected');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(
        {
          name: ['Child with this name already exists'],
          non_field_errors: ['Duplicate child detected'],
        },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle array of errors per field', () => {
      let errorCaught = false;

      const createData: ChildCreate = {
        name: 'a', // Too short
        date_of_birth: '2024-03-01',
        gender: 'M',
      };

      service.create(createData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('name');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(
        {
          name: ['Ensure this field has at least 2 characters', 'Another validation error'],
        },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('state consistency', () => {
    it('should not update children signal on error', () => {
      const initialChildren = [...mockChildren];
      service.children.set(initialChildren);

      const createData: ChildCreate = {
        name: 'Baby Test',
        date_of_birth: '2024-03-01',
        gender: 'M',
      };

      service.create(createData).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(
        { name: ['This field is required'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(service.children()).toEqual(initialChildren);
    });

    it('should not modify selectedChild signal on get error', () => {
      const selectedBefore = mockChild;
      service.selectedChild.set(selectedBefore);

      service.get(999).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/children/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(service.selectedChild()).toEqual(selectedBefore);
    });

    it('should not remove from children signal on update error', () => {
      service.children.set([...mockChildren]);

      const updateData: ChildUpdate = {
        name: 'Invalid Update',
      };

      service.update(1, updateData).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(
        { name: ['This field is required'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(service.children()).toEqual(mockChildren);
    });

    it('should not modify children signal on delete error', () => {
      service.children.set([...mockChildren]);

      service.delete(1).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(service.children()).toEqual(mockChildren);
    });
  });

  describe('concurrent request errors', () => {
    it('should handle errors in concurrent list and get requests', () => {
      let listErrorCaught = false;
      let getErrorCaught = false;

      service.list().subscribe({
        error: () => {
          listErrorCaught = true;
        },
      });

      service.get(1).subscribe({
        error: () => {
          getErrorCaught = true;
        },
      });

      const listReq = httpMock.expectOne('/api/v1/children/');
      const getReq = httpMock.expectOne('/api/v1/children/1/');

      listReq.flush(null, { status: 500, statusText: 'Internal Server Error' });
      getReq.flush(null, { status: 404, statusText: 'Not Found' });

      expect(listErrorCaught).toBe(true);
      expect(getErrorCaught).toBe(true);
    });

    it('should handle create and update error simultaneously', () => {
      let createErrorCaught = false;
      let updateErrorCaught = false;

      const createData: ChildCreate = {
        name: 'Baby Test',
        date_of_birth: '2024-03-01',
        gender: 'M',
      };

      const updateData: ChildUpdate = {
        name: 'Updated',
      };

      service.create(createData).subscribe({
        error: () => {
          createErrorCaught = true;
        },
      });

      service.update(1, updateData).subscribe({
        error: () => {
          updateErrorCaught = true;
        },
      });

      const createReq = httpMock.expectOne('/api/v1/children/');
      const updateReq = httpMock.expectOne('/api/v1/children/1/');

      createReq.flush({}, { status: 400, statusText: 'Bad Request' });
      updateReq.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(createErrorCaught).toBe(true);
      expect(updateErrorCaught).toBe(true);
    });
  });

  describe('retry scenarios', () => {
    it('should allow retry after error on list()', () => {
      let firstErrorCaught = false;
      let secondSuccessCaught = false;

      // First request - fails
      service.list().subscribe({
        error: () => {
          firstErrorCaught = true;
        },
      });

      let req = httpMock.expectOne('/api/v1/children/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(firstErrorCaught).toBe(true);

      // Retry - succeeds
      service.list().subscribe({
        next: (children) => {
          expect(children).toEqual(mockChildren);
          secondSuccessCaught = true;
        },
      });

      req = httpMock.expectOne('/api/v1/children/');
      req.flush({ count: mockChildren.length, next: null, previous: null, results: mockChildren });

      expect(secondSuccessCaught).toBe(true);
    });

    it('should allow retry after error on get()', () => {
      let firstErrorCaught = false;
      let secondSuccessCaught = false;

      // First request - fails
      service.get(1).subscribe({
        error: () => {
          firstErrorCaught = true;
        },
      });

      let req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(firstErrorCaught).toBe(true);

      // Retry - succeeds
      service.get(1).subscribe({
        next: (child) => {
          expect(child).toEqual(mockChild);
          secondSuccessCaught = true;
        },
      });

      req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(mockChild);

      expect(secondSuccessCaught).toBe(true);
    });

    it('should handle retry after partial update error', () => {
      let firstErrorCaught = false;
      let secondSuccessCaught = false;

      const updateData: ChildUpdate = {
        name: 'Updated Name',
      };

      const updatedChild: Child = {
        ...mockChild,
        name: 'Updated Name',
      };

      // First request - fails
      service.update(1, updateData).subscribe({
        error: () => {
          firstErrorCaught = true;
        },
      });

      let req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(null, { status: 409, statusText: 'Conflict' });

      expect(firstErrorCaught).toBe(true);

      // Verify state unchanged
      expect(service.selectedChild()).toBeNull();

      // Retry - succeeds
      service.update(1, updateData).subscribe({
        next: (child) => {
          expect(child).toEqual(updatedChild);
          secondSuccessCaught = true;
        },
      });

      req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(updatedChild);

      expect(secondSuccessCaught).toBe(true);
    });
  });

  describe('edge case errors', () => {
    it('should handle error with array as response body', () => {
      let errorCaught = false;

      service.get(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.flush(['Array', 'response'], { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });

    it('should handle error with string response body', () => {
      let errorCaught = false;

      service.list().subscribe({
        error: (error: Error) => {
          expect(error.message).toBeDefined();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush('String error message', { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 401 error and not update children signal', () => {
      let errorCaught = false;

      service.list().subscribe({
        error: () => {
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
      expect(service.children()).toEqual([]);
    });

    it('should maintain selectedChild during failed get retry', () => {
      const existingChild = mockChildren[1];
      service.selectedChild.set(existingChild);

      // Failed request
      service.get(2).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/children/2/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      // Verify selectedChild unchanged
      expect(service.selectedChild()).toEqual(existingChild);
    });
  });
});
