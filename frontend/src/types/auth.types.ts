import { User } from './user.types';

// Register DTO
export interface RegisterDto {
  name: string;
  password: string;
  avatarUrl?: string;
}

// Login DTO
export interface LoginDto {
  name: string;
  password: string;
}

// Auth Response
export interface AuthResponse {
  user: User;
  token: string;
}

// Token Refresh Response
export interface TokenRefreshResponse {
  token: string;
}

// Current User Response
export interface CurrentUserResponse {
  user: User;
}

// Token Payload (decoded JWT)
export interface TokenPayload {
  userId: string;
  name: string;
  iat?: number;
  exp?: number;
}

// Logout Response
export interface LogoutResponse {
  message: string;
}

