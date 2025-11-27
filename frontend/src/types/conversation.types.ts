import { ConversationType, MemberRole } from './enums';
import { UserBasic } from './user.types';

// Conversation Member
export interface ConversationMember {
  id: string;
  userId: string;
  conversationId: string;
  role: MemberRole;
  joinedAt: Date;
  lastReadMessageId: string | null;
  user: UserBasic;
}

// Conversation
export interface Conversation {
  id: string;
  name: string;
  type: ConversationType;
  description: string | null;
  slug: string | null;
  isPublic: boolean;
  isReadOnly: boolean;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
  members: ConversationMember[];
}

// Create Direct Conversation DTO
export interface CreateDirectConversationDto {
  otherUserId: string;
}

// Create Group/Channel Conversation DTO
export interface CreateConversationDto {
  name: string;
  type: ConversationType;
  description?: string;
  slug?: string;
  isPublic?: boolean;
  isReadOnly?: boolean;
  avatarUrl?: string;
}

// Update Conversation DTO
export interface UpdateConversationDto {
  name?: string;
  description?: string;
  avatarUrl?: string;
  isPublic?: boolean;
  isReadOnly?: boolean;
}

// Conversation Filters
export interface ConversationFilters {
  type?: ConversationType;
  isPublic?: boolean;
  name?: string;
}

// Add Members DTO
export interface AddMembersDto {
  userIds: string[];
  role?: MemberRole;
}

// Update Member Role DTO
export interface UpdateMemberRoleDto {
  role: MemberRole;
}

// Generate Slug DTO
export interface GenerateSlugDto {
  name: string;
}

// Slug Response
export interface SlugResponse {
  slug: string;
}

// Join Channel By Slug Response
export interface JoinChannelResponse {
  conversation: Conversation;
}

