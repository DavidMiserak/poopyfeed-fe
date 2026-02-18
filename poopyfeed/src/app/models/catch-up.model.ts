/**
 * Catch-Up Mode model interfaces.
 *
 * Catch-Up Mode allows caregivers to retroactively log multiple baby events
 * (feedings, diapers, naps) in a single session with smart time estimation
 * and drag-and-drop reordering. Events are submitted atomically via the batch
 * endpoint: POST /api/v1/children/{childId}/batch/
 *
 * Time estimation uses proportional distribution:
 * - Feeding: typical 20 minutes
 * - Diaper: typical 5 minutes
 * - Nap: typical 60 minutes
 *
 * All timestamps are ISO 8601 UTC format. The UI converts to/from local timezone.
 */

import type { FeedingCreate } from './feeding.model';
import type { DiaperChangeCreate } from './diaper.model';
import type { NapCreate } from './nap.model';

/**
 * Time window for catch-up session.
 *
 * Defines the start and end time boundary within which events are logged.
 * Validation ensures: start < end, end not in future (±5min), max 24 hours.
 */
export interface TimeWindow {
  /** Start time of the catch-up window (ISO 8601, UTC) */
  startTime: string;

  /** End time of the catch-up window (ISO 8601, UTC) */
  endTime: string;
}

/**
 * Single event in the catch-up timeline.
 *
 * Represents either a new event being logged or an existing event serving as
 * an anchor point. New events are submitted to the batch endpoint; existing
 * events are read-only reference markers.
 *
 * The `isPinned` flag allows users to manually override event timestamps.
 * When recalculating times (e.g., after reordering), pinned events remain
 * fixed and other events are distributed around them.
 */
export interface CatchUpEvent {
  /** Client-side UUID for tracking (not sent to API) */
  id: string;

  /** Event type: 'feeding', 'diaper', or 'nap' */
  type: 'feeding' | 'diaper' | 'nap';

  /** Auto-calculated or manually-set timestamp (ISO 8601, UTC) */
  estimatedTime: string;

  /** True if user manually set this timestamp (skip recalculation on reorder) */
  isPinned: boolean;

  /** True if this is an existing event (read-only, not submitted) */
  isExisting: boolean;

  /** Existing event ID (only present if isExisting === true) */
  existingId?: number;

  /**
   * Event-specific data.
   *
   * Exactly one of FeedingCreate, DiaperChangeCreate, or NapCreate
   * depending on the `type` field.
   */
  data: FeedingCreate | DiaperChangeCreate | NapCreate;

  /** Optional notes about the event (max 500 characters) */
  notes?: string;
}

/**
 * Request body for batch submission to POST /api/v1/children/{childId}/batch/
 *
 * Each event in the array is validated server-side. If any event fails
 * validation, the entire batch is rejected (atomic: all-or-nothing).
 */
export interface BatchRequest {
  /** Array of events to create (1-20 events per batch) */
  events: BatchEventPayload[];
}

/**
 * Single event payload in batch request.
 *
 * Maps CatchUpEvent to the format expected by the backend batch endpoint.
 * The `type` field determines which fields are expected in `data`.
 */
export interface BatchEventPayload {
  /** Event type: 'feeding', 'diaper', or 'nap' */
  type: 'feeding' | 'diaper' | 'nap';

  /** Event-specific data (FeedingCreate, DiaperChangeCreate, or NapCreate) */
  data: FeedingCreate | DiaperChangeCreate | NapCreate;
}

/**
 * Successful batch submission response (201 Created).
 *
 * Contains the full serialized objects for all created events, allowing the
 * frontend to update local state without additional API calls.
 */
export interface BatchResponse {
  /** Array of created event objects with server-assigned IDs and timestamps */
  created: BatchCreatedEvent[];

  /** Number of events created */
  count: number;
}

/**
 * Single created event in batch response.
 *
 * Includes the event type, ID, and all serialized fields from the API.
 * The structure matches the individual endpoint responses for consistency.
 */
export interface BatchCreatedEvent {
  /** Event type: 'feeding', 'diaper', or 'nap' */
  type: 'feeding' | 'diaper' | 'nap';

  /** Server-assigned event ID */
  id: number;

  /**
   * Full serialized event data.
   *
   * Includes all fields from the API response (e.g., created_at, updated_at,
   * display fields). The exact structure depends on the event type.
   *
   * Typed as unknown because the structure varies by type; handle in frontend
   * code based on the `type` field.
   */
  [key: string]: unknown;
}

/**
 * Batch error response (400 Bad Request).
 *
 * When validation fails, the backend returns detailed error information
 * for each failing event. This allows the frontend to highlight specific
 * event cards and show field-level error messages without losing data.
 *
 * Example:
 * ```json
 * {
 *   "errors": [
 *     {
 *       "index": 0,
 *       "type": "feeding",
 *       "errors": {
 *         "amount_oz": ["Amount is required for bottle feedings."]
 *       }
 *     }
 *   ]
 * }
 * ```
 */
export interface BatchErrorResponse {
  /** Array of per-event validation errors */
  errors: BatchEventError[];
}

/**
 * Validation error for a single event in batch request.
 *
 * The `index` field indicates which event in the request failed. The `errors`
 * object maps field names to arrays of error messages, matching the format
 * of individual endpoint error responses.
 */
export interface BatchEventError {
  /** Index of the failing event in the request array */
  index: number;

  /** Event type: 'feeding', 'diaper', or 'nap' */
  type: 'feeding' | 'diaper' | 'nap';

  /** Field-level error messages (field name → error strings) */
  errors: Record<string, string[]>;
}

/**
 * Time estimation result for a set of events.
 *
 * Returned by TimeEstimationService to provide calculated timestamps
 * for all new events based on proportional distribution within the time window.
 */
export interface TimeEstimationResult {
  /** Mapped events with calculated estimatedTime for each */
  events: CatchUpEvent[];

  /** True if total typical durations exceeded window (overflow detected) */
  isOverflowed: boolean;

  /** Total duration of all new events in milliseconds */
  totalDurationMs: number;

  /** Available gap time for distribution in milliseconds */
  gapTimeMs: number;
}

/**
 * Configuration for time estimation algorithm.
 *
 * Typical durations used to distribute events proportionally within
 * a time window. Values match backend defaults.
 */
export interface TimeEstimationConfig {
  /** Typical feeding duration in minutes */
  feedingDurationMinutes: number;

  /** Typical diaper change duration in minutes */
  diaperDurationMinutes: number;

  /** Typical nap duration in minutes */
  napDurationMinutes: number;

  /** Minimum gap between consecutive events in minutes */
  minGapMinutes: number;
}

/**
 * Default time estimation configuration.
 *
 * These values are used by the time estimation algorithm to distribute
 * events proportionally within a time window. They match the values specified
 * in the catch-up mode specification.
 */
export const DEFAULT_TIME_ESTIMATION_CONFIG: TimeEstimationConfig = {
  feedingDurationMinutes: 20,
  diaperDurationMinutes: 5,
  napDurationMinutes: 60,
  minGapMinutes: 2,
};

/**
 * Validation constants for catch-up mode.
 *
 * These values enforce business rules for time windows and event limits.
 */
export const CATCH_UP_VALIDATION = {
  /** Maximum number of new events per catch-up session */
  MAX_EVENTS_PER_BATCH: 20,

  /** Maximum time window duration in hours */
  MAX_WINDOW_HOURS: 24,

  /** Tolerance for end time being in the future (in minutes) */
  FUTURE_TIME_TOLERANCE_MINUTES: 5,

  /** Default catch-up window (how far back to default, in hours) */
  DEFAULT_WINDOW_HOURS: 4,
};
