// Token storage helpers for managing JWT tokens

import { authConfig } from '@/lib/config/app-config';

// Get token from localStorage
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(authConfig.tokenKey);
}

// Set token in localStorage
export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(authConfig.tokenKey, token);
}

// Remove token from localStorage
export function clearToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(authConfig.tokenKey);
}

// Check if token exists
export function hasToken(): boolean {
  return !!getToken();
}

