import { Status } from './enums';

// User Response (from backend)
// Note: updatedAt is optional because auth endpoints use mapUserToResponse which excludes it,
// while user endpoints return the full Prisma User object which includes it.
export interface User {
  id: string;
  name: string;
  avatarUrl: string | null;
  status: Status | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}

// Minimal User Info (used in messages, reactions, etc.)
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

// User Search Query
export interface UserSearchQuery {
  q?: string;
  limit?: number;
}

// Update User Data
export interface UpdateUserData {
  name?: string;
  avatarUrl?: string;
  status?: Status;
}

// User Presence Info
export interface UserPresence {
  userId: string;
  status: Status;
  lastSeenAt: Date | null;
}

// Bulk Presence Request
export interface BulkPresenceRequest {
  userIds: string[];
}

// Bulk Presence Response
export interface BulkPresenceResponse {
  presences: UserPresence[];
}

