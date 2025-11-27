// User API - handles user-related API calls
import { apiClient } from './api-client';
import type {
  User,
  UpdateUserData,
  UserSearchQuery,
  UserPresence,
  BulkPresenceRequest,
  BulkPresenceResponse,
} from '@/types';

export const userApi = {
  // Get current user
  getCurrentUser: () => {
    return apiClient.get<{ user: User }>('/users/me').then((res) => res.user);
  },

  // Update current user
  updateCurrentUser: (data: UpdateUserData) => {
    return apiClient.patch<{ user: User }>('/users/me', data).then((res) => res.user);
  },

  // Get user by ID
  getUserById: (userId: string) => {
    return apiClient.get<{ user: User }>(`/users/${userId}`).then((res) => res.user);
  },

  // Search users
  searchUsers: (query: UserSearchQuery) => {
    return apiClient.get<{ users: User[] }>('/users/search', { params: query as any }).then((res) => res.users);
  },

  // Get user presence
  getUserPresence: (userId: string) => {
    return apiClient.get<{ presence: UserPresence }>(`/users/${userId}/presence`).then((res) => res.presence);
  },

  // Get bulk user presences
  getBulkPresences: (data: BulkPresenceRequest) => {
    return apiClient.post<BulkPresenceResponse>('/users/presence/bulk', data);
  },

  // Update presence heartbeat
  updatePresenceHeartbeat: () => {
    return apiClient.post<{ message: string }>('/users/presence/heartbeat');
  },

  // Check permissions
  checkPermissions: () => {
    return apiClient.get<{ permissions: Record<string, boolean> }>('/users/permissions');
  },
};

