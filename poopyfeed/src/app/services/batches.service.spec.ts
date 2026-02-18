import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { BatchesService } from './batches.service';
import {
  BatchResponse,
  BatchErrorResponse,
  CatchUpEvent,
} from '../models';

describe('BatchesService', () => {
  let service: BatchesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BatchesService],
    });

    service = TestBed.inject(BatchesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('create', () => {
    it('should submit batch request with correct endpoint', () => {
      const childId = 1;
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            feeding_type: 'bottle',
            fed_at: '',
            amount_oz: 4,
          },
        },
      ];

      const response: BatchResponse = {
        created: [
          {
            type: 'feeding',
            id: 1,
            feeding_type: 'bottle',
            fed_at: '2026-02-17T10:00:00Z',
            amount_oz: 4,
            created_at: '2026-02-17T12:00:00Z',
            updated_at: '2026-02-17T12:00:00Z',
          },
        ],
        count: 1,
      };

      let result: BatchResponse | undefined;
      service.create(childId, events).subscribe({
        next: (res) => {
          result = res;
        },
      });

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      expect(req.request.method).toBe('POST');
      req.flush(response);

      expect(result).toBeDefined();
      expect(result?.count).toBe(1);
      expect(result?.created.length).toBe(1);
    });

    it('should send events in correct request format', () => {
      const childId = 1;
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            feeding_type: 'bottle',
            fed_at: '',
            amount_oz: 4,
          },
        },
        {
          id: '2',
          type: 'diaper',
          estimatedTime: '2026-02-17T10:25:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            change_type: 'wet',
            changed_at: '',
          },
        },
      ];

      const response: BatchResponse = {
        created: [],
        count: 2,
      };

      service.create(childId, events).subscribe();

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      const body = req.request.body;

      expect(body.events).toBeDefined();
      expect(body.events.length).toBe(2);
      expect(body.events[0].type).toBe('feeding');
      expect(body.events[0].data.feeding_type).toBe('bottle');
      expect(body.events[1].type).toBe('diaper');
      expect(body.events[1].data.change_type).toBe('wet');

      req.flush(response);
    });

    it('should use estimated time in request', () => {
      const childId = 1;
      const estimatedTime = '2026-02-17T10:00:00Z';
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime,
          isPinned: false,
          isExisting: false,
          data: {
            feeding_type: 'bottle',
            fed_at: 'ignored',
            amount_oz: 4,
          },
        },
      ];

      const response: BatchResponse = {
        created: [],
        count: 1,
      };

      service.create(childId, events).subscribe();

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      expect(req.request.body.events[0].data.fed_at).toBe(estimatedTime);

      req.flush(response);
    });

    it('should exclude existing events from submission', () => {
      const childId = 1;
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: true,
          existingId: 1,
          data: {
            feeding_type: 'bottle',
            fed_at: '2026-02-17T10:00:00Z',
            amount_oz: 4,
          },
        },
        {
          id: '2',
          type: 'diaper',
          estimatedTime: '2026-02-17T10:25:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            change_type: 'wet',
            changed_at: '',
          },
        },
      ];

      const response: BatchResponse = {
        created: [],
        count: 1, // Only 1 new event
      };

      service.create(childId, events).subscribe();

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);

      // Request should only include the diaper event (not existing feeding)
      expect(req.request.body.events.length).toBe(1);
      expect(req.request.body.events[0].type).toBe('diaper');

      req.flush(response);
    });

    it('should handle successful response with multiple events', () => {
      const childId = 1;
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            feeding_type: 'bottle',
            fed_at: '',
            amount_oz: 4,
          },
        },
        {
          id: '2',
          type: 'diaper',
          estimatedTime: '2026-02-17T10:25:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            change_type: 'wet',
            changed_at: '',
          },
        },
        {
          id: '3',
          type: 'nap',
          estimatedTime: '2026-02-17T10:30:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            napped_at: '',
            ended_at: '',
          },
        },
      ];

      const response: BatchResponse = {
        created: [
          {
            type: 'feeding',
            id: 42,
            feeding_type: 'bottle',
            fed_at: '2026-02-17T10:00:00Z',
            amount_oz: 4,
            created_at: '2026-02-17T12:00:00Z',
            updated_at: '2026-02-17T12:00:00Z',
          },
          {
            type: 'diaper',
            id: 15,
            change_type: 'wet',
            changed_at: '2026-02-17T10:25:00Z',
            created_at: '2026-02-17T12:00:00Z',
            updated_at: '2026-02-17T12:00:00Z',
          },
          {
            type: 'nap',
            id: 8,
            napped_at: '2026-02-17T10:30:00Z',
            ended_at: '2026-02-17T11:30:00Z',
            duration_minutes: 60,
            created_at: '2026-02-17T12:00:00Z',
            updated_at: '2026-02-17T12:00:00Z',
          },
        ],
        count: 3,
      };

      let result: BatchResponse | undefined;
      service.create(childId, events).subscribe({
        next: (res) => {
          result = res;
        },
      });

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      req.flush(response);

      expect(result).toBeDefined();
      expect(result?.count).toBe(3);
      expect(result?.created.length).toBe(3);
      expect(result?.created[0].type).toBe('feeding');
      expect(result?.created[0].id).toBe(42);
      expect(result?.created[1].type).toBe('diaper');
      expect(result?.created[1].id).toBe(15);
      expect(result?.created[2].type).toBe('nap');
      expect(result?.created[2].id).toBe(8);
    });

    it('should handle validation error response with per-event errors', () => {
      const childId = 1;
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            feeding_type: 'bottle',
            fed_at: '',
            amount_oz: undefined,
          },
        },
      ];

      const errorResponse: BatchErrorResponse = {
        errors: [
          {
            index: 0,
            type: 'feeding',
            errors: {
              amount_oz: ['Amount is required for bottle feedings.'],
            },
          },
        ],
      };

      let errorCaught = false;
      let error: any = null;

      service.create(childId, events).subscribe({
        error: (err) => {
          errorCaught = true;
          error = err;
        },
      });

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
      expect(error).toBeTruthy();
      expect(error.batchErrors).toBeDefined();
      expect(error.batchErrors?.errors[0].index).toBe(0);
      expect(error.batchErrors?.errors[0].type).toBe('feeding');
      expect(error.batchErrors?.errors[0].errors.amount_oz).toBeDefined();
    });

    it('should handle multiple event validation errors', () => {
      const childId = 1;
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            feeding_type: 'bottle',
            fed_at: '',
            amount_oz: undefined,
          },
        },
        {
          id: '2',
          type: 'nap',
          estimatedTime: '2026-02-17T11:00:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            napped_at: '2026-02-17T11:30:00Z',
            ended_at: '2026-02-17T11:00:00Z', // Invalid: end before start
          },
        },
      ];

      const errorResponse: BatchErrorResponse = {
        errors: [
          {
            index: 0,
            type: 'feeding',
            errors: {
              amount_oz: ['Amount is required for bottle feedings.'],
            },
          },
          {
            index: 1,
            type: 'nap',
            errors: {
              ended_at: ['End time must be after start time.'],
            },
          },
        ],
      };

      let errorCaught = false;
      let error: any = null;

      service.create(childId, events).subscribe({
        error: (err) => {
          errorCaught = true;
          error = err;
        },
      });

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
      expect(error.batchErrors?.errors.length).toBe(2);
      expect(error.batchErrors?.errors[0].index).toBe(0);
      expect(error.batchErrors?.errors[1].index).toBe(1);
    });

    it('should handle generic error response (non-batch format)', () => {
      const childId = 1;
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            feeding_type: 'bottle',
            fed_at: '',
            amount_oz: 4,
          },
        },
      ];

      let errorCaught = false;

      service.create(childId, events).subscribe({
        error: (err) => {
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      req.flush(
        { detail: 'Internal Server Error' },
        { status: 500, statusText: 'Internal Server Error' },
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 401 Unauthorized error', () => {
      const childId = 1;
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            feeding_type: 'bottle',
            fed_at: '',
            amount_oz: 4,
          },
        },
      ];

      let errorCaught = false;

      service.create(childId, events).subscribe({
        error: (err) => {
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      req.flush(
        { detail: 'Authentication credentials were not provided.' },
        { status: 401, statusText: 'Unauthorized' },
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 404 Not Found error (child not found)', () => {
      const childId = 999;
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: false,
          data: {
            feeding_type: 'bottle',
            fed_at: '',
            amount_oz: 4,
          },
        },
      ];

      let errorCaught = false;

      service.create(childId, events).subscribe({
        error: (err) => {
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      req.flush(
        { detail: 'Not found.' },
        { status: 404, statusText: 'Not Found' },
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle empty events array', () => {
      const childId = 1;
      const events: CatchUpEvent[] = [];

      const response: BatchResponse = {
        created: [],
        count: 0,
      };

      let result: BatchResponse | undefined;
      service.create(childId, events).subscribe({
        next: (res) => {
          result = res;
        },
      });

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      expect(req.request.body.events.length).toBe(0);
      req.flush(response);

      expect(result).toBeDefined();
      expect(result?.count).toBe(0);
      expect(result?.created.length).toBe(0);
    });

    it('should handle all events being existing (no new events)', () => {
      const childId = 1;
      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: true,
          existingId: 1,
          data: {
            feeding_type: 'bottle',
            fed_at: '2026-02-17T10:00:00Z',
            amount_oz: 4,
          },
        },
      ];

      const response: BatchResponse = {
        created: [],
        count: 0,
      };

      let result: BatchResponse | undefined;
      service.create(childId, events).subscribe({
        next: (res) => {
          result = res;
        },
      });

      const req = httpMock.expectOne(`/api/v1/children/${childId}/batch/`);
      expect(req.request.body.events.length).toBe(0);
      req.flush(response);

      expect(result).toBeDefined();
      expect(result?.count).toBe(0);
    });
  });
});
