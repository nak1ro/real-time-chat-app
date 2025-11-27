// Application Configuration - runtime configuration and constants

import { env } from '@/config/env';

// API Configuration
export const apiConfig = {
  baseUrl: env.apiUrl,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
} as const;

// Authentication Configuration
export const authConfig = {
  tokenKey: 'auth_token',
  tokenExpiryBuffer: 5 * 60 * 1000, // 5 minutes buffer before expiry
  refreshTokenThreshold: 15 * 60 * 1000, // Refresh when 15 minutes remaining
} as const;

// Pagination Configuration
export const paginationConfig = {
  defaultPageSize: 50,
  maxPageSize: 100,
} as const;

// File Upload Configuration
export const uploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// UI Configuration
export const uiConfig = {
  messageMaxLength: 10000,
  conversationNameMaxLength: 100,
  userNameMaxLength: 50,
  toastDuration: 5000, // 5 seconds
} as const;
