export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  timezone: string;
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  timezone?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ChangePasswordResponse {
  detail: string;
  auth_token: string;
}

export interface DeleteAccountRequest {
  current_password: string;
}
