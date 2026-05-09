import type { Staff, StaffRole } from './staff';

export type { StaffRole };

export type StaffMe = Staff;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
