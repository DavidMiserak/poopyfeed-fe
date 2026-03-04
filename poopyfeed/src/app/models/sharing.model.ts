/**
 * Sharing and invite model interfaces for the PoopyFeed API.
 *
 * Covers child shares (existing access), share invites (pending), and
 * invite create/accept payloads. Used by sharing management and invite-accept flows.
 */

/**
 * Child share object (existing access grant).
 *
 * Returned from GET /api/v1/children/{id}/shares/.
 *
 * @interface ChildShare
 */
export interface ChildShare {
  /** Unique share identifier */
  id: number;

  /** Child ID this share applies to */
  child: number;

  /** Email of the user with shared access */
  user_email: string;

  /** Role granted: co-parent or caregiver */
  role: 'co-parent' | 'caregiver';

  /** When the share was created (ISO 8601, UTC) */
  shared_at: string;
}

/**
 * Share invite object (pending invitation).
 *
 * Returned from GET /api/v1/children/{id}/invites/.
 *
 * @interface ShareInvite
 */
export interface ShareInvite {
  /** Unique invite identifier */
  id: number;

  /** Child ID this invite is for */
  child: number;

  /** UUID token for invite URL (e.g. /invites/accept/{token}) */
  token: string;

  /** Role that will be granted on accept */
  role: 'co-parent' | 'caregiver';

  /** Whether the invite is still valid (not revoked/expired) */
  is_active: boolean;

  /** When the invite was created (ISO 8601, UTC) */
  created_at: string;

  /** When the invite expires (ISO 8601, UTC) */
  expires_at: string;
}

/**
 * Data required to create a new invite.
 *
 * Sent to POST /api/v1/children/{id}/invites/.
 *
 * @interface InviteCreate
 */
export interface InviteCreate {
  /** Role to grant: co-parent or caregiver */
  role: 'co-parent' | 'caregiver';
}

/**
 * Data required to accept an invite.
 *
 * Token is provided in URL; this type is used for request body if needed.
 *
 * @interface InviteAccept
 */
export interface InviteAccept {
  /** Invite token from URL */
  token: string;
}

/**
 * Response from accepting an invite (POST accept endpoint).
 *
 * @interface InviteAcceptResponse
 */
export interface InviteAcceptResponse {
  /** Child the user now has access to */
  child: {
    id: number;
    name: string;
  };
}

/**
 * Role display labels for sharing UI.
 */
export const SHARE_ROLE_LABELS: Record<
  ChildShare['role'] | ShareInvite['role'],
  string
> = {
  'co-parent': 'Co-parent',
  caregiver: 'Caregiver',
};

/**
 * Role descriptions for invite creation (tooltips, help text).
 */
export const SHARE_ROLE_DESCRIPTIONS: Record<
  ChildShare['role'] | ShareInvite['role'],
  string
> = {
  'co-parent':
    'Can view and track all activities. Can manage sharing (except owner removal).',
  caregiver: 'Can view and track all activities. Cannot manage sharing.',
};
