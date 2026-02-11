/**
 * Diaper change model interfaces for the PoopyFeed API.
 *
 * Tracks when diapers were changed and the type of change:
 * - 'wet': Urine only
 * - 'dirty': Feces/stool only
 * - 'both': Both urine and feces
 */

/**
 * Complete diaper change object returned from the API.
 *
 * Records a single diaper change event with timestamp and optional notes.
 * All timestamps are in UTC (ISO 8601 format).
 */
export interface DiaperChange {
  /** Unique diaper change identifier (database primary key) */
  id: number;

  /** ID of the child whose diaper was changed */
  child: number;

  /** Type of change: 'wet', 'dirty', or 'both' */
  change_type: 'wet' | 'dirty' | 'both';

  /** When diaper change occurred (ISO 8601, UTC) */
  changed_at: string;

  /** Optional notes about diaper change (max 500 characters) */
  notes?: string;

  /** When record was created (ISO 8601, UTC) */
  created_at: string;

  /** When record was last modified (ISO 8601, UTC) */
  updated_at: string;
}

/**
 * Data required to create a new diaper change.
 *
 * Sent to POST /api/v1/children/{childId}/diapers/ endpoint.
 * API automatically sets created_at and updated_at timestamps.
 */
export interface DiaperChangeCreate {
  /** Type of change: 'wet', 'dirty', or 'both' (required) */
  change_type: 'wet' | 'dirty' | 'both';

  /** When change occurred (required, ISO 8601, UTC) */
  changed_at: string;

  /** Optional notes about the change (optional, max 500 characters) */
  notes?: string;
}

/**
 * Data that can be updated for an existing diaper change.
 *
 * Sent to PATCH /api/v1/children/{childId}/diapers/{id}/ endpoint.
 * All fields are optional; only provided fields are updated.
 */
export type DiaperChangeUpdate = Partial<DiaperChangeCreate>;

/**
 * Diaper change type display labels for templates and dropdowns.
 *
 * Maps change_type values to human-readable labels for UI display.
 *
 * @example
 * const changeType = 'both';
 * const display = CHANGE_TYPE_LABELS[changeType]; // 'Both'
 */
export const CHANGE_TYPE_LABELS: Record<DiaperChange['change_type'], string> =
  {
    wet: 'Wet',
    dirty: 'Dirty',
    both: 'Both',
  };

/**
 * Validation constants for diaper change forms.
 *
 * These values MUST match the backend constraints.
 * Currently only maximum notes length is validated.
 */
export const DIAPER_VALIDATION = {
  /** Maximum length for optional notes field */
  MAX_NOTES_LENGTH: 500,
};
