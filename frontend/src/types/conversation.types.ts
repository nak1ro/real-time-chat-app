import { ConversationType, MemberRole } from './enums';
import { UserBasic } from './user.types';

// Conversation member with user and role info
export interface ConversationMember {
  id: string;
  userId: string;
  conversationId: string;
  role: MemberRole;
  joinedAt: Date;
  lastReadMessageId: string | null;
  user: UserBasic;
}

// Full conversation object from API
export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  slug: string | null;
  description: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  isReadOnly: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdById?: string | null;
  members: ConversationMember[];
  messages?: any[]; // Last message preview
  _count?: {
    members: number;
  };
}

// Request DTO for creating direct conversation
export interface CreateDirectConversationData {
  otherUserId: string;
}

// Request DTO for creating group or channel
export interface CreateConversationData {
  name: string;
  type: ConversationType;
  description?: string;
  slug?: string;
  isPublic?: boolean;
  isReadOnly?: boolean;
  avatarUrl?: string;
}

// Request DTO for updating conversation
export interface UpdateConversationPatch {
  name?: string;
  description?: string;
  avatarUrl?: string;
  isPublic?: boolean;
  isReadOnly?: boolean;
}

// Query filters for listing conversations
export interface ConversationFilters {
  type?: ConversationType;
  isPublic?: boolean;
  name?: string;
}

// Request DTO for adding members
export interface AddMembersData {
  userIds: string[];
  role?: MemberRole;
}

// Request DTO for updating member role
export interface UpdateMemberRoleData {
  role: MemberRole;
}

// Request DTO for generating slug
export interface GenerateSlugData {
  name: string;
}

// Response types
export interface ConversationResponse {
  conversation: Conversation;
}

export interface ConversationsListResponse {
  conversations: Conversation[];
}

export interface PublicChannelsResponse {
  channels: Conversation[];
}

export interface SlugResponse {
  slug: string;
}

export interface LeaveConversationResponse {
  message: string;
}

// Legacy aliases for backward compatibility
export type CreateDirectConversationDto = CreateDirectConversationData;
export type CreateConversationDto = CreateConversationData;
export type UpdateConversationDto = UpdateConversationPatch;
export type AddMembersDto = AddMembersData;
export type UpdateMemberRoleDto = UpdateMemberRoleData;
export type GenerateSlugDto = GenerateSlugData;
export type JoinChannelResponse = ConversationResponse;
