/**
 * Child model interfaces for the PoopyFeed API.
 *
 * A child represents a baby or toddler being tracked by caregivers. Children
 * can be shared with co-parents and caregivers via role-based access control:
 * - Owner: The child's creator, can manage sharing
 * - Co-parent: Can view, add, and edit tracking records
 * - Caregiver: Can view and add tracking records only
 */

/**
 * Complete child object returned from the API.
 *
 * Includes calculated fields for last activity timestamps, which are computed
 * server-side for performance. These fields are essential for the dashboard
 * to display "last fed", "last diaper change", "last nap" without additional
 * API calls.
 *
 * IMPORTANT: When creating mock Child objects in tests, always include all
 * last_* fields (can be null), otherwise TypeScript compilation will fail.
 */
export interface Child {
  /** Unique child identifier (database primary key) */
  id: number;

  /** Child's name (max 100 characters) */
  name: string;

  /** Child's date of birth in ISO format (YYYY-MM-DD) */
  date_of_birth: string;

  /** Child's gender: 'M' (Male), 'F' (Female), 'O' (Other) */
  gender: 'M' | 'F' | 'O';

  /** Current user's role for this child */
  user_role: 'owner' | 'co-parent' | 'caregiver';

  /** Timestamp when child was created (ISO 8601, UTC) */
  created_at: string;

  /** Timestamp when child was last modified (ISO 8601, UTC) */
  updated_at: string;

  /** Timestamp of most recent diaper change (ISO 8601, UTC, or null if none) */
  last_diaper_change: string | null;

  /** Timestamp of most recent nap (ISO 8601, UTC, or null if none) */
  last_nap: string | null;

  /** Timestamp of most recent feeding (ISO 8601, UTC, or null if none) */
  last_feeding: string | null;
}

/**
 * Data required to create a new child.
 *
 * Sent to POST /api/v1/children/ endpoint. The API automatically sets
 * created_at, updated_at, and assigns the authenticated user as owner.
 */
export interface ChildCreate {
  /** Child's name (required, max 100 characters) */
  name: string;

  /** Child's date of birth in ISO format (required, YYYY-MM-DD) */
  date_of_birth: string;

  /** Child's gender: 'M', 'F', or 'O' (required) */
  gender: 'M' | 'F' | 'O';
}

/**
 * Data that can be updated for an existing child.
 *
 * Sent to PATCH /api/v1/children/{id}/ endpoint. All fields are optional;
 * only provided fields are updated. Only owners and co-parents can update.
 */
export interface ChildUpdate {
  /** Updated child's name (optional, max 100 characters) */
  name?: string;

  /** Updated date of birth in ISO format (optional, YYYY-MM-DD) */
  date_of_birth?: string;

  /** Updated gender (optional, 'M' | 'F' | 'O') */
  gender?: 'M' | 'F' | 'O';
}

/**
 * Gender display labels for templates and UI.
 *
 * Maps single-character database values to human-readable strings.
 * Use in dropdowns, badges, and display components.
 *
 * @example
 * const childGender = 'M';
 * const display = GENDER_LABELS[childGender]; // 'Male'
 */
export const GENDER_LABELS: Record<Child['gender'], string> = {
  M: 'Male',
  F: 'Female',
  O: 'Other',
};

/**
 * Role display labels for templates and UI.
 *
 * Maps API role strings to human-readable labels. Used in sharing management UI,
 * permission displays, and user role badges.
 *
 * @example
 * const userRole = child.user_role;
 * const display = ROLE_LABELS[userRole]; // 'Owner' | 'Co-parent' | 'Caregiver'
 */
export const ROLE_LABELS: Record<Child['user_role'], string> = {
  owner: 'Owner',
  'co-parent': 'Co-parent',
  caregiver: 'Caregiver',
};
