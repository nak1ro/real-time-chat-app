import { apiClient } from './api-client';
import { getToken } from '@/lib/auth/token-storage';
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
  OnlineContact,
  OnlineContactsResponse,
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
    const formData = new FormData();

    if (data.name !== undefined) {
      formData.append('name', data.name);
    }

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    // Use a custom fetch for PATCH with FormData since apiClient.upload only supports POST
    const token = getToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/me`, {
      method: 'PATCH',
      headers,
      body: formData,
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Request failed' }));
          throw new Error(error.message || `Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((res) => res.data.user);
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

  // Get online contacts (users with direct conversations who are currently online)
  getOnlineContacts: (): Promise<OnlineContact[]> => {
    return apiClient
      .get<OnlineContactsResponse>('/api/users/contacts/online')
      .then((res) => res.contacts);
  },
};
