/**
 * User and account model interfaces for the PoopyFeed API.
 *
 * Used by account profile, password change, and account deletion endpoints.
 */

/**
 * User profile as returned from GET /api/v1/auth/users/me/.
 *
 * @interface UserProfile
 */
export interface UserProfile {
  /** Unique user identifier */
  id: number;

  /** User's email address */
  email: string;

  /** User's first name */
  first_name: string;

  /** User's last name */
  last_name: string;

  /** User's timezone (e.g. America/New_York) for display and quiet hours */
  timezone: string;
}

/**
 * Payload for PATCH /api/v1/auth/users/me/.
 * All fields optional; only provided fields are updated.
 *
 * @interface UserProfileUpdate
 */
export interface UserProfileUpdate {
  /** Updated first name */
  first_name?: string;

  /** Updated last name */
  last_name?: string;

  /** Updated email */
  email?: string;

  /** Updated timezone (IANA, e.g. America/New_York) */
  timezone?: string;
}

/**
 * Payload for POST password change endpoint.
 *
 * @interface ChangePasswordRequest
 */
export interface ChangePasswordRequest {
  /** Current password for verification */
  current_password: string;

  /** New password */
  new_password: string;

  /** Must match new_password */
  new_password_confirm: string;
}

/**
 * Response from successful password change (Djoser).
 * New auth token is returned; client should replace stored token.
 *
 * @interface ChangePasswordResponse
 */
export interface ChangePasswordResponse {
  /** Success message */
  detail: string;

  /** New auth token to use for subsequent requests */
  auth_token: string;
}

/**
 * Payload for account deletion (requires current password).
 *
 * @interface DeleteAccountRequest
 */
export interface DeleteAccountRequest {
  /** Current password for verification */
  current_password: string;
}
