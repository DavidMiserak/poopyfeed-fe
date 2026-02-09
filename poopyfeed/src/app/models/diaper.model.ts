/**
 * Diaper change model interfaces for the PoopyFeed API
 */

/**
 * Complete diaper change object returned from the API
 */
export interface DiaperChange {
  id: number;
  child: number;
  change_type: 'wet' | 'dirty' | 'both';
  changed_at: string; // ISO datetime string (UTC)
  notes?: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * Data required to create a new diaper change
 */
export interface DiaperChangeCreate {
  change_type: 'wet' | 'dirty' | 'both';
  changed_at: string; // ISO datetime string (UTC)
  notes?: string;
}

/**
 * Data that can be updated for an existing diaper change
 */
export type DiaperChangeUpdate = Partial<DiaperChangeCreate>;

/**
 * Change type display labels
 */
export const CHANGE_TYPE_LABELS: Record<DiaperChange['change_type'], string> =
  {
    wet: 'Wet',
    dirty: 'Dirty',
    both: 'Both',
  };

/**
 * Validation constants
 */
export const DIAPER_VALIDATION = {
  MAX_NOTES_LENGTH: 500,
};
