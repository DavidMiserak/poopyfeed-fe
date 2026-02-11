/**
 * Feeding model interfaces for the PoopyFeed API.
 *
 * Supports two feeding types with conditional field requirements:
 *
 * **Bottle Feeding:**
 * - Requires: amount_oz (0.1-50.0 oz)
 * - Must NOT include: duration_minutes, side
 *
 * **Breast Feeding:**
 * - Requires: duration_minutes (1-180 min) and side (left/right/both)
 * - Must NOT include: amount_oz
 *
 * The backend enforces these rules with CheckConstraints at the database level.
 * Forms and services should validate conditional requirements before submission.
 */

/**
 * Complete feeding object returned from the API.
 *
 * Either amount_oz or duration_minutes/side will be present depending on
 * feeding_type. The other fields will be null/undefined.
 */
export interface Feeding {
  /** Unique feeding identifier (database primary key) */
  id: number;

  /** ID of the child this feeding belongs to */
  child: number;

  /** Type of feeding: 'bottle' or 'breast' */
  feeding_type: 'bottle' | 'breast';

  /** When feeding occurred (ISO 8601, UTC) */
  fed_at: string;

  /** Amount in ounces (0.1-50.0, bottle only, required if feeding_type === 'bottle') */
  amount_oz?: number;

  /** Duration in minutes (1-180, breast only, required if feeding_type === 'breast') */
  duration_minutes?: number;

  /** Breast side: 'left', 'right', 'both' (breast only, required if feeding_type === 'breast') */
  side?: 'left' | 'right' | 'both';

  /** Optional notes about feeding (max 500 characters) */
  notes?: string;

  /** When feeding was recorded (ISO 8601, UTC) */
  created_at: string;

  /** When feeding was last modified (ISO 8601, UTC) */
  updated_at: string;
}

/**
 * Data required to create a new feeding.
 *
 * Sent to POST /api/v1/children/{childId}/feedings/ endpoint.
 * Conditional field requirements:
 * - If feeding_type === 'bottle': amount_oz is required, ignore duration_minutes/side
 * - If feeding_type === 'breast': duration_minutes and side are required, ignore amount_oz
 *
 * Frontend forms should validate conditional requirements before submission.
 */
export interface FeedingCreate {
  /** Type of feeding (required) */
  feeding_type: 'bottle' | 'breast';

  /** When feeding occurred (required, ISO 8601, UTC) */
  fed_at: string;

  /** Amount in ounces (required if feeding_type === 'bottle', otherwise omit/null) */
  amount_oz?: number;

  /** Duration in minutes (required if feeding_type === 'breast', otherwise omit/null) */
  duration_minutes?: number;

  /** Breast side (required if feeding_type === 'breast', otherwise omit/null) */
  side?: 'left' | 'right' | 'both';

  /** Optional notes (optional, max 500 characters) */
  notes?: string;
}

/**
 * Data that can be updated for an existing feeding.
 *
 * Sent to PATCH /api/v1/children/{childId}/feedings/{id}/ endpoint.
 * All fields are optional; only provided fields are updated.
 * Follow same conditional requirements as FeedingCreate.
 */
export type FeedingUpdate = Partial<FeedingCreate>;

/**
 * Feeding type display labels for templates and dropdowns.
 *
 * Maps feeding_type values to human-readable labels for UI display.
 *
 * @example
 * const type = 'bottle';
 * const display = FEEDING_TYPE_LABELS[type]; // 'Bottle'
 */
export const FEEDING_TYPE_LABELS: Record<Feeding['feeding_type'], string> = {
  bottle: 'Bottle',
  breast: 'Breast',
};

/**
 * Breast side display labels for templates and dropdowns.
 *
 * Maps side values to human-readable labels. Used in forms and displays
 * for breast feeding side selection.
 *
 * @example
 * const side = 'left';
 * const display = SIDE_LABELS[side]; // 'Left'
 */
export const SIDE_LABELS: Record<NonNullable<Feeding['side']>, string> = {
  left: 'Left',
  right: 'Right',
  both: 'Both',
};

/**
 * Validation constants for feeding form validation and error messages.
 *
 * These values MUST match the backend constraints in:
 * - back-end/feedings/constants.py
 * - back-end/feedings/models.py CheckConstraints
 *
 * Use these constants in form validators, error messages, and placeholder text
 * to ensure frontend validation matches server-side constraints.
 *
 * @example
 * // Validate bottle amount
 * const isValid = amount >= FEEDING_VALIDATION.MIN_BOTTLE_OZ &&
 *                 amount <= FEEDING_VALIDATION.MAX_BOTTLE_OZ;
 *
 * // Error message
 * const errorMsg = `Amount must be between ${FEEDING_VALIDATION.MIN_BOTTLE_OZ} ` +
 *                  `and ${FEEDING_VALIDATION.MAX_BOTTLE_OZ} oz`;
 */
export const FEEDING_VALIDATION = {
  /** Minimum bottle feeding amount in ounces */
  MIN_BOTTLE_OZ: 0.1,

  /** Maximum bottle feeding amount in ounces */
  MAX_BOTTLE_OZ: 50,

  /** Minimum breast feeding duration in minutes */
  MIN_BREAST_MINUTES: 1,

  /** Maximum breast feeding duration in minutes */
  MAX_BREAST_MINUTES: 180,

  /** Maximum length for optional notes field */
  MAX_NOTES_LENGTH: 500,
};
