import { User } from '@prisma/client';

/**
 * DTOs (Data Transfer Objects)
 */

export interface RegisterDto {
  name: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface UserResponse {
  id: string;
  name: string;
  avatarUrl: string | null;
  status: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
}

/**
 * Request Extensions
 */
export interface AuthenticatedRequest {
  user?: {
    id: string;
    name: string;
    email?: string;
  };
}

/**
 * Token Payload
 */
export interface TokenPayload {
  userId: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Type Guards
 */
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};


