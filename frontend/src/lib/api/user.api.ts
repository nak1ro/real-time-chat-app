import { apiClient } from './api-client';
import type {
  User,
  UpdateUserData,
  UserSearchParams,
  UserPresence,
  BulkPresenceData,
  UserResponse,
  UsersResponse,
  PresenceResponse,
  BulkPresenceResponse,
  PermissionCheckParams,
  PermissionResponse,
  HeartbeatResponse,
} from '@/types';

export const userApi = {
  // Get current user profile
  getMe: (): Promise<User> => {
    return apiClient
      .get<UserResponse>('/api/users/me')
      .then((res) => res.user);
  },

  // Update current user profile
  updateMe: (data: UpdateUserData): Promise<User> => {
    return apiClient
      .patch<UserResponse>('/api/users/me', data)
      .then((res) => res.user);
  },

  // Get user by ID
  getById: (id: string): Promise<User> => {
    return apiClient
      .get<UserResponse>(`/api/users/${id}`)
      .then((res) => res.user);
  },

  // Search users by name
  search: (params: UserSearchParams): Promise<User[]> => {
    return apiClient
      .get<UsersResponse>('/api/users/search', { params: params as any })
      .then((res) => res.users);
  },

  // Get presence status for a user
  getPresence: (userId: string): Promise<UserPresence> => {
    return apiClient
      .get<PresenceResponse>(`/api/users/${userId}/presence`)
      .then((res) => res.status);
  },

  // Get presence status for multiple users
  getBulkPresence: (data: BulkPresenceData): Promise<UserPresence[]> => {
    return apiClient
      .post<BulkPresenceResponse>('/api/users/presence/bulk', data)
      .then((res) => res.users);
  },

  // Send presence heartbeat
  sendHeartbeat: (): Promise<HeartbeatResponse> => {
    return apiClient.post<HeartbeatResponse>('/api/users/presence/heartbeat');
  },

  // Check permission for an action in a conversation
  checkPermission: (params: PermissionCheckParams): Promise<boolean> => {
    return apiClient
      .get<PermissionResponse>('/api/users/permissions', { params: params as any })
      .then((res) => res.canPerform);
  },
};
