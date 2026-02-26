import { describe, it, expect } from 'vitest';
import {
  type Notification,
  type NotificationEventType,
  type UnreadCountResponse,
  type MarkAllReadResponse,
  type NotificationPreference,
  type NotificationPreferenceUpdate,
  type QuietHours,
  type QuietHoursUpdate,
  NOTIFICATION_EVENT_LABELS,
} from './notification.model';

describe('notification.model', () => {
  const EVENT_TYPES: NotificationEventType[] = ['feeding', 'diaper', 'nap'];

  describe('NOTIFICATION_EVENT_LABELS', () => {
    it('should have a label for every NotificationEventType', () => {
      for (const key of EVENT_TYPES) {
        expect(NOTIFICATION_EVENT_LABELS).toHaveProperty(key);
        expect(typeof NOTIFICATION_EVENT_LABELS[key]).toBe('string');
        expect(NOTIFICATION_EVENT_LABELS[key].length).toBeGreaterThan(0);
      }
    });

    it('should have exactly three keys (feeding, diaper, nap)', () => {
      expect(Object.keys(NOTIFICATION_EVENT_LABELS)).toHaveLength(3);
      expect(NOTIFICATION_EVENT_LABELS).toMatchObject({
        feeding: 'Feeding',
        diaper: 'Diaper Change',
        nap: 'Nap',
      });
    });

    it('should not have extra keys', () => {
      const keys = Object.keys(NOTIFICATION_EVENT_LABELS) as NotificationEventType[];
      expect(keys.sort()).toEqual([...EVENT_TYPES].sort());
    });
  });

  describe('interface contracts (mock shape)', () => {
    it('Notification: minimal valid object satisfies shape', () => {
      const mock: Notification = {
        id: 1,
        event_type: 'feeding',
        message: 'Alice logged a feeding for Baby Bob',
        is_read: false,
        created_at: '2025-02-26T12:00:00Z',
        actor_name: 'Alice',
        child_name: 'Baby Bob',
        child_id: 42,
      };
      expect(mock.event_type).toBe('feeding');
      expect(mock.child_id).toBe(42);
    });

    it('UnreadCountResponse: minimal valid object satisfies shape', () => {
      const mock: UnreadCountResponse = { count: 3 };
      expect(mock.count).toBe(3);
    });

    it('MarkAllReadResponse: minimal valid object satisfies shape', () => {
      const mock: MarkAllReadResponse = { updated: 5 };
      expect(mock.updated).toBe(5);
    });

    it('NotificationPreference: minimal valid object satisfies shape', () => {
      const mock: NotificationPreference = {
        id: 1,
        child_id: 10,
        child_name: 'Baby Sue',
        notify_feedings: true,
        notify_diapers: true,
        notify_naps: false,
      };
      expect(mock.notify_naps).toBe(false);
    });

    it('NotificationPreferenceUpdate: partial object is valid', () => {
      const mock: NotificationPreferenceUpdate = { notify_feedings: false };
      expect(mock.notify_feedings).toBe(false);
    });

    it('QuietHours: minimal valid object satisfies shape', () => {
      const mock: QuietHours = {
        enabled: true,
        start_time: '22:00:00',
        end_time: '07:00:00',
      };
      expect(mock.enabled).toBe(true);
      expect(mock.start_time).toBe('22:00:00');
    });

    it('QuietHoursUpdate: partial object is valid', () => {
      const mock: QuietHoursUpdate = { enabled: true };
      expect(mock.enabled).toBe(true);
    });
  });
});
