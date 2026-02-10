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
          expect(error.message).toBe(
            'You must be logged in to perform this action.'
          );
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
          expect(error.message).toBe('Server error. Please try again later.');
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
          expect(error.message).toBe('Child not found.');
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
          expect(error.message).toBe(
            'You do not have permission to perform this action.'
          );
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
          expect(error.message).toBe('non_field_errors: Invalid data provided');
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
          expect(error.message).toBe('Child not found.');
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
          expect(error.message).toBe('Child not found.');
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
          expect(error.message).toBe(
            'You do not have permission to perform this action.'
          );
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
          expect(error.message).toBe('Custom error detail');
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
          expect(error.message).toBe(
            'Invalid request. Please check your input.'
          );
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
          expect(error.message).toBe(
            'Get child: An unexpected error occurred. Please try again.'
          );
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/');
      req.error(new ProgressEvent('error'));

      expect(errorCaught).toBe(true);
    });
  });
});
