/**
 * Sharing and invite model interfaces for the PoopyFeed API
 */

/**
 * Child share object (existing access grants)
 */
export interface ChildShare {
  id: number;
  child: number;
  user_email: string;
  role: 'co-parent' | 'caregiver';
  shared_at: string; // ISO datetime string
}

/**
 * Share invite object (pending invitations)
 */
export interface ShareInvite {
  id: number;
  child: number;
  token: string; // UUID token for invite URL
  role: 'co-parent' | 'caregiver';
  is_active: boolean;
  created_at: string; // ISO datetime string
  expires_at: string; // ISO datetime string
}

/**
 * Data required to create a new invite
 */
export interface InviteCreate {
  role: 'co-parent' | 'caregiver';
}

/**
 * Data required to accept an invite
 */
export interface InviteAccept {
  token: string;
}

/**
 * Response from accepting an invite
 */
export interface InviteAcceptResponse {
  child: {
    id: number;
    name: string;
  };
}

/**
 * Role display labels
 */
export const SHARE_ROLE_LABELS: Record<
  ChildShare['role'] | ShareInvite['role'],
  string
> = {
  'co-parent': 'Co-parent',
  caregiver: 'Caregiver',
};

/**
 * Role descriptions for invite creation
 */
export const SHARE_ROLE_DESCRIPTIONS: Record<
  ChildShare['role'] | ShareInvite['role'],
  string
> = {
  'co-parent':
    'Can view and track all activities. Can manage sharing (except owner removal).',
  caregiver: 'Can view and track all activities. Cannot manage sharing.',
};
