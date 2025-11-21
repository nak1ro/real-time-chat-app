import { Status } from '@prisma/client';

/**
 * User Creation Data
 */
export interface CreateUserData {
  name: string;
  passwordHash: string;
  avatarUrl?: string;
  status?: Status;
}

/**
 * User Query Options
 */
export interface UserQueryOptions {
  includeMessages?: boolean;
  includeConversations?: boolean;
  includeDevices?: boolean;
}


