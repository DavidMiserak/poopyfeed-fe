/**
 * Feeding model interfaces for the PoopyFeed API
 */

/**
 * Complete feeding object returned from the API
 */
export interface Feeding {
  id: number;
  child: number;
  feeding_type: 'bottle' | 'breast';
  fed_at: string; // ISO datetime string (UTC)
  amount_oz?: number; // Required for bottle, null for breast
  duration_minutes?: number; // Required for breast, null for bottle
  side?: 'left' | 'right' | 'both'; // Required for breast, null for bottle
  notes?: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * Data required to create a new feeding
 * Conditional fields based on feeding_type
 */
export interface FeedingCreate {
  feeding_type: 'bottle' | 'breast';
  fed_at: string; // ISO datetime string (UTC)
  amount_oz?: number; // Required if feeding_type === 'bottle'
  duration_minutes?: number; // Required if feeding_type === 'breast'
  side?: 'left' | 'right' | 'both'; // Required if feeding_type === 'breast'
  notes?: string;
}

/**
 * Data that can be updated for an existing feeding
 */
export type FeedingUpdate = Partial<FeedingCreate>;

/**
 * Feeding type display labels
 */
export const FEEDING_TYPE_LABELS: Record<Feeding['feeding_type'], string> = {
  bottle: 'Bottle',
  breast: 'Breast',
};

/**
 * Side display labels
 */
export const SIDE_LABELS: Record<NonNullable<Feeding['side']>, string> = {
  left: 'Left',
  right: 'Right',
  both: 'Both',
};

/**
 * Validation constants (must match backend)
 */
export const FEEDING_VALIDATION = {
  MIN_BOTTLE_OZ: 0.1,
  MAX_BOTTLE_OZ: 50,
  MIN_BREAST_MINUTES: 1,
  MAX_BREAST_MINUTES: 180,
  MAX_NOTES_LENGTH: 500,
};
