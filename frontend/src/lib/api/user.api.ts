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
  // Update current user profile
  updateMe: async (data: UpdateUserData): Promise<User> => {
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/me`, {
      method: 'PATCH',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({message: 'Request failed'}));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }
    const res = await response.json();
    return res.data.user;
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const res = await apiClient
        .get<UserResponse>(`/api/users/${id}`);
    return res.user;
  },

  // Search users by name
  search: async (params: UserSearchParams): Promise<User[]> => {
    const res = await apiClient
        .get<UsersResponse>('/api/users/search', {params: params as any});
    return res.users;
  },

  // Get presence status for a user
  getPresence: async (userId: string): Promise<UserPresence> => {
    const res = await apiClient
        .get<PresenceResponse>(`/api/users/${userId}/presence`);
    return res.status;
  },

  // Get presence status for multiple users
  getBulkPresence: async (data: BulkPresenceData): Promise<UserPresence[]> => {
    const res = await apiClient
        .post<BulkPresenceResponse>('/api/users/presence/bulk', data);
    return res.users;
  },

  // Send presence heartbeat
  sendHeartbeat: (): Promise<HeartbeatResponse> => {
    return apiClient.post<HeartbeatResponse>('/api/users/presence/heartbeat');
  },

  // Check permission for an action in a conversation
  checkPermission: async (params: PermissionCheckParams): Promise<boolean> => {
    const res = await apiClient
        .get<PermissionResponse>('/api/users/permissions', {params: params as any});
    return res.canPerform;
  },

  // Get online contacts (users with direct conversations who are currently online)
  getOnlineContacts: async (): Promise<OnlineContact[]> => {
    const res = await apiClient
        .get<OnlineContactsResponse>('/api/users/contacts/online');
    return res.contacts;
  },
};
