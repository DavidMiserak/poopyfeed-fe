/**
 * Tests for NotificationService
 */

import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NotificationService } from './notification.service';
import type {
  Notification,
  NotificationPreference,
  QuietHours,
} from '../models/notification.model';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  const mockNotification: Notification = {
    id: 1,
    event_type: 'feeding',
    message: 'Alice logged a feeding for Baby Bob',
    is_read: false,
    created_at: '2025-02-26T12:00:00Z',
    actor_name: 'Alice',
    child_name: 'Baby Bob',
    child_id: 42,
  };

  const mockNotifications: Notification[] = [
    mockNotification,
    {
      id: 2,
      event_type: 'diaper',
      message: 'Bob logged a diaper change for Baby Bob',
      is_read: true,
      created_at: '2025-02-26T11:00:00Z',
      actor_name: 'Bob',
      child_name: 'Baby Bob',
      child_id: 42,
    },
  ];

  const mockPreference: NotificationPreference = {
    id: 1,
    child_id: 42,
    child_name: 'Baby Bob',
    notify_feedings: true,
    notify_diapers: true,
    notify_naps: false,
  };

  const mockQuietHours: QuietHours = {
    enabled: true,
    start_time: '22:00:00',
    end_time: '07:00:00',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch notifications and update signal', () => {
      service.list().subscribe({
        next: (list) => {
          expect(list).toEqual(mockNotifications);
          expect(service.notifications()).toEqual(mockNotifications);
        },
      });

      const req = httpMock.expectOne((r) =>
        r.url.startsWith('/api/v1/notifications/') && !r.url.includes('unread-count')
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        count: 2,
        next: null,
        previous: null,
        results: mockNotifications,
      });
    });

    it('should pass page param when provided', () => {
      service.list(2).subscribe();

      const req = httpMock.expectOne('/api/v1/notifications/?page=2');
      expect(req.request.params.get('page')).toBe('2');
      req.flush({ count: 0, next: null, previous: null, results: [] });
    });

    it('should handle list error', () => {
      let errorCaught = false;
      service.list().subscribe({
        error: (err: Error) => {
          expect(err.message).toBeDefined();
          errorCaught = true;
        },
      });
      const req = httpMock.expectOne((r) =>
        r.url.startsWith('/api/v1/notifications/') && !r.url.includes('unread-count')
      );
      req.flush(null, { status: 500, statusText: 'Server Error' });
      expect(errorCaught).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should fetch unread count and update signal', () => {
      service.getUnreadCount().subscribe({
        next: (count) => {
          expect(count).toBe(3);
          expect(service.unreadCount()).toBe(3);
        },
      });

      const req = httpMock.expectOne('/api/v1/notifications/unread-count/');
      expect(req.request.method).toBe('GET');
      req.flush({ count: 3 });
    });

    it('should handle unread count error', () => {
      let errorCaught = false;
      service.getUnreadCount().subscribe({
        error: () => {
          errorCaught = true;
        },
      });
      const req = httpMock.expectOne('/api/v1/notifications/unread-count/');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
      expect(errorCaught).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should PATCH notification and update local state', () => {
      service.notifications.set(mockNotifications);
      service.unreadCount.set(2);

      service.markAsRead(1).subscribe({
        next: (updated) => {
          expect(updated.is_read).toBe(true);
          expect(service.unreadCount()).toBe(1);
          const list = service.notifications();
          expect(list.find((n) => n.id === 1)?.is_read).toBe(true);
        },
      });

      const req = httpMock.expectOne('/api/v1/notifications/1/');
      expect(req.request.method).toBe('PATCH');
      req.flush({ ...mockNotification, is_read: true });
    });
  });

  describe('markAllRead', () => {
    it('should POST mark-all-read and update signals', () => {
      service.notifications.set(mockNotifications);
      service.unreadCount.set(1);

      service.markAllRead().subscribe({
        next: (updated) => {
          expect(updated).toBe(1);
          expect(service.unreadCount()).toBe(0);
          expect(service.notifications().every((n) => n.is_read)).toBe(true);
        },
      });

      const req = httpMock.expectOne('/api/v1/notifications/mark-all-read/');
      expect(req.request.method).toBe('POST');
      req.flush({ updated: 1 });
    });
  });

  describe('getPreferences', () => {
    it('should fetch preferences and update signal', () => {
      const prefs = [mockPreference];
      service.getPreferences().subscribe({
        next: (list) => {
          expect(list).toEqual(prefs);
          expect(service.preferences()).toEqual(prefs);
        },
      });

      const req = httpMock.expectOne('/api/v1/notifications/preferences/');
      expect(req.request.method).toBe('GET');
      req.flush({ count: 1, next: null, previous: null, results: prefs });
    });
  });

  describe('updatePreference', () => {
    it('should PATCH preference and update signal', () => {
      service.preferences.set([mockPreference]);
      const updated = { ...mockPreference, notify_feedings: false };

      service.updatePreference(1, { notify_feedings: false }).subscribe({
        next: (p) => {
          expect(p.notify_feedings).toBe(false);
          expect(service.preferences()[0].notify_feedings).toBe(false);
        },
      });

      const req = httpMock.expectOne('/api/v1/notifications/preferences/1/');
      expect(req.request.method).toBe('PATCH');
      req.flush(updated);
    });
  });

  describe('getQuietHours', () => {
    it('should fetch quiet hours and update signal', () => {
      service.getQuietHours().subscribe({
        next: (qh) => {
          expect(qh).toEqual(mockQuietHours);
          expect(service.quietHours()).toEqual(mockQuietHours);
        },
      });

      const req = httpMock.expectOne('/api/v1/notifications/quiet-hours/');
      expect(req.request.method).toBe('GET');
      req.flush(mockQuietHours);
    });
  });

  describe('updateQuietHours', () => {
    it('should PATCH quiet hours and update signal', () => {
      service.updateQuietHours({ enabled: true }).subscribe({
        next: (qh) => {
          expect(qh.enabled).toBe(true);
          expect(service.quietHours()?.enabled).toBe(true);
        },
      });

      const req = httpMock.expectOne('/api/v1/notifications/quiet-hours/');
      expect(req.request.method).toBe('PATCH');
      req.flush(mockQuietHours);
    });
  });

  describe('startUnreadCountPolling', () => {
    it('should set isPolling to true when started (document defined)', () => {
      const destroyRef = TestBed.inject(DestroyRef);
      service.startUnreadCountPolling(destroyRef);
      expect(service.isPolling()).toBe(true);
    });

    it('should not make request when document is undefined (SSR)', () => {
      const doc = globalThis.document;
      (globalThis as unknown as { document: undefined }).document = undefined;
      const destroyRef = TestBed.inject(DestroyRef);

      service.startUnreadCountPolling(destroyRef);

      expect(httpMock.match('/api/v1/notifications/unread-count/').length).toBe(0);
      (globalThis as unknown as { document: typeof doc }).document = doc;
    });
  });
});
