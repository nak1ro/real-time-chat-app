import { Status } from './enums';

// Full user object from API
export interface User {
  id: string;
  name: string;
  avatarUrl: string | null;
  status: Status | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}

// Minimal user info used in messages, reactions, etc.
export interface UserBasic {
  id: string;
  name: string;
  avatarUrl: string | null;
}

// User with status info
export interface UserWithStatus extends UserBasic {
  status: Status | null;
  lastSeenAt: Date | null;
}

// Request DTO for updating user profile
export interface UpdateUserData {
  name?: string;
  avatar?: File;
}

// Search query parameters
export interface UserSearchParams {
  query: string;
}

// User presence info
export interface UserPresence {
  userId: string;
  status: Status;
  lastSeenAt: Date | null;
}

// Request DTO for bulk presence
export interface BulkPresenceData {
  userIds: string[];
}

// Permission check parameters
export interface PermissionCheckParams {
  conversationId: string;
  action: 'sendMessage' | 'manageMembers' | 'moderateMessage';
}

// Response types
export interface UserResponse {
  user: User;
}

export interface UsersResponse {
  users: User[];
}

export interface PresenceResponse {
  status: UserPresence;
}

export interface BulkPresenceResponse {
  users: UserPresence[];
}

export interface PermissionResponse {
  canPerform: boolean;
}

export interface HeartbeatResponse {
  message: string;
}

// Online contact (user with direct conversation who is online)
export interface OnlineContact {
  id: string;
  name: string;
  avatarUrl: string | null;
  status: Status;
  lastSeenAt: Date | null;
}

export interface OnlineContactsResponse {
  contacts: OnlineContact[];
}

// Legacy aliases for backward compatibility
export type UserSearchQuery = UserSearchParams;
export type BulkPresenceRequest = BulkPresenceData;
