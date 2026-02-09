/**
 * Child model interfaces for the PoopyFeed API
 */

/**
 * Complete child object returned from the API
 */
export interface Child {
  id: number;
  name: string;
  date_of_birth: string; // ISO date string (YYYY-MM-DD)
  gender: 'M' | 'F' | 'O';
  user_role: 'owner' | 'co-parent' | 'caregiver';
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  last_diaper_change: string | null; // ISO datetime string or null
  last_nap: string | null; // ISO datetime string or null
  last_feeding: string | null; // ISO datetime string or null
}

/**
 * Data required to create a new child
 */
export interface ChildCreate {
  name: string;
  date_of_birth: string; // ISO date string (YYYY-MM-DD)
  gender: 'M' | 'F' | 'O';
}

/**
 * Data that can be updated for an existing child
 */
export interface ChildUpdate {
  name?: string;
  date_of_birth?: string; // ISO date string (YYYY-MM-DD)
  gender?: 'M' | 'F' | 'O';
}

/**
 * Gender display labels
 */
export const GENDER_LABELS: Record<Child['gender'], string> = {
  M: 'Male',
  F: 'Female',
  O: 'Other',
};

/**
 * Role display labels
 */
export const ROLE_LABELS: Record<Child['user_role'], string> = {
  owner: 'Owner',
  'co-parent': 'Co-parent',
  caregiver: 'Caregiver',
};
