/**
 * Notification model interfaces for the PoopyFeed API.
 *
 * In-app notifications alert shared users when someone logs a feeding,
 * diaper change, or nap for a shared child. Includes per-child preferences
 * and global quiet hours.
 */

/**
 * Event types that trigger notifications (matches backend EventType).
 */
export type NotificationEventType = 'feeding' | 'diaper' | 'nap' | 'feeding_reminder';

/**
 * Notification as returned from GET /api/v1/notifications/.
 *
 * Ordered by created_at descending (newest first). Used in list (paginated)
 * and in PATCH response when marking a single notification as read.
 */
export interface Notification {
  /** Unique notification identifier */
  id: number;

  /** Type of activity that triggered the notification */
  event_type: NotificationEventType;

  /** Human-readable message (e.g. "Alice logged a feeding for Baby Bob") */
  message: string;

  /** Whether the recipient has read the notification */
  is_read: boolean;

  /** When the notification was created (ISO 8601, UTC) */
  created_at: string;

  /** Display name of the user who performed the activity (first name or email local part) */
  actor_name: string;

  /** Name of the child the activity was for */
  child_name: string;

  /** Child id for navigation to child dashboard */
  child_id: number;
}

/**
 * Response from GET /api/v1/notifications/unread-count/.
 */
export interface UnreadCountResponse {
  /** Number of unread notifications for the authenticated user */
  count: number;
}

/**
 * Response from POST /api/v1/notifications/mark-all-read/.
 */
export interface MarkAllReadResponse {
  /** Number of notifications marked as read */
  updated: number;
}

/**
 * Per-child notification preference as returned from GET /api/v1/notifications/preferences/.
 *
 * Controls which event types generate notifications for a specific child.
 * Created automatically when the user first fetches preferences.
 */
export interface NotificationPreference {
  /** Unique preference identifier */
  id: number;

  /** Child id this preference applies to */
  child_id: number;

  /** Child name for display in settings UI */
  child_name: string;

  /** Whether to create notifications for feeding events */
  notify_feedings: boolean;

  /** Whether to create notifications for diaper change events */
  notify_diapers: boolean;

  /** Whether to create notifications for nap events */
  notify_naps: boolean;
}

/**
 * Payload for PATCH /api/v1/notifications/preferences/{id}/.
 * All fields optional; only provided fields are updated.
 */
export interface NotificationPreferenceUpdate {
  notify_feedings?: boolean;
  notify_diapers?: boolean;
  notify_naps?: boolean;
}

/**
 * Global quiet hours as returned from GET /api/v1/notifications/quiet-hours/.
 *
 * During quiet hours (in the user's timezone), no notifications are created.
 * Times are in "HH:MM:SS" format (user local time); overnight ranges supported (e.g. 22:00–07:00).
 */
export interface QuietHours {
  /** Whether quiet hours are enabled */
  enabled: boolean;

  /** Start of quiet period (e.g. "22:00:00") */
  start_time: string;

  /** End of quiet period (e.g. "07:00:00") */
  end_time: string;
}

/**
 * Payload for PATCH /api/v1/notifications/quiet-hours/.
 * All fields optional; only provided fields are updated.
 */
export interface QuietHoursUpdate {
  enabled?: boolean;
  start_time?: string;
  end_time?: string;
}

/**
 * Event type display labels for UI (bell dropdown, icons, etc.).
 */
export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string> = {
  feeding: 'Feeding',
  diaper: 'Diaper Change',
  nap: 'Nap',
  feeding_reminder: 'Feeding Reminder',
};
