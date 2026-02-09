/**
 * Nap model interfaces for the PoopyFeed API
 */

/**
 * Complete nap object returned from the API
 */
export interface Nap {
  id: number;
  child: number;
  napped_at: string; // ISO datetime string (UTC)
  notes?: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * Data required to create a new nap
 */
export interface NapCreate {
  napped_at: string; // ISO datetime string (UTC)
  notes?: string;
}

/**
 * Data that can be updated for an existing nap
 */
export type NapUpdate = Partial<NapCreate>;

/**
 * Validation constants
 */
export const NAP_VALIDATION = {
  MAX_NOTES_LENGTH: 500,
};
