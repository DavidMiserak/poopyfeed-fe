/**
 * Nap model interfaces for the PoopyFeed API.
 *
 * Tracks when a child took a nap. Currently stores only the start time (napped_at).
 * Nap duration can be calculated by comparing with next activity or using
 * explicit nap end times if implemented in future versions.
 */

/**
 * Complete nap object returned from the API.
 *
 * Records a single nap event with timestamp and optional notes.
 * All timestamps are in UTC (ISO 8601 format).
 */
export interface Nap {
  /** Unique nap identifier (database primary key) */
  id: number;

  /** ID of the child who napped */
  child: number;

  /** When nap started (ISO 8601, UTC) */
  napped_at: string;

  /** Optional notes about nap (max 500 characters) */
  notes?: string;

  /** When record was created (ISO 8601, UTC) */
  created_at: string;

  /** When record was last modified (ISO 8601, UTC) */
  updated_at: string;
}

/**
 * Data required to create a new nap.
 *
 * Sent to POST /api/v1/children/{childId}/naps/ endpoint.
 * API automatically sets created_at and updated_at timestamps.
 */
export interface NapCreate {
  /** When nap started (required, ISO 8601, UTC) */
  napped_at: string;

  /** Optional notes about nap (optional, max 500 characters) */
  notes?: string;
}

/**
 * Data that can be updated for an existing nap.
 *
 * Sent to PATCH /api/v1/children/{childId}/naps/{id}/ endpoint.
 * All fields are optional; only provided fields are updated.
 */
export type NapUpdate = Partial<NapCreate>;

/**
 * Validation constants for nap forms.
 *
 * These values MUST match the backend constraints.
 * Currently only maximum notes length is validated.
 */
export const NAP_VALIDATION = {
  /** Maximum length for optional notes field */
  MAX_NOTES_LENGTH: 500,
};
