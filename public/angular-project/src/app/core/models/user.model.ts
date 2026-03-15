// ─── User Models ───────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  membershipTier: string;
  policyCount: number;
  memberSince: string;
  address: string;
  panNumber: string;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface ProfileInput {
  name: string;
  phone: string;
  address: string;
  panNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: LoginResponse;
}

export interface OtpRequest {
  email: string;
}

export interface OtpVerifyRequest {
  email: string;
  code: string;
}

export interface PasswordResetRequest {
  password: string;
  confirmPassword: string;
}

export interface ProfileResponse {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  panNumber: string | null;
  avatarText: string | null;
  membershipTier: string;
  createdAt: string;
  updatedAt: string;
}
