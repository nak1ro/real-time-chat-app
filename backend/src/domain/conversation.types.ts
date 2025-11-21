import { Conversation, ConversationMember, User, MemberRole } from '@prisma/client';

// Type alias for conversation types
export type ConversationType = 'DIRECT' | 'GROUP' | 'CHANNEL';

// Conversation with full member details (including user info)
export interface ConversationWithMembers extends Conversation {
  members: Array<ConversationMember & { user: User }>;
}

// Conversation with basic member info only
export interface ConversationWithBasicMembers extends Conversation {
  members: ConversationMember[];
}

// Input for creating a group or channel conversation
export interface CreateConversationData {
  name: string;
  type: ConversationType;
  description?: string;
  slug?: string;
  isPublic?: boolean;
  isReadOnly?: boolean;
  avatarUrl?: string;
}

// Filters for listing conversations
export interface ConversationFilters {
  type?: ConversationType;
  isPublic?: boolean;
  name?: string;
}

// Partial update data for conversation
export interface UpdateConversationPatch {
  name?: string;
  description?: string;
  avatarUrl?: string;
  isPublic?: boolean;
  isReadOnly?: boolean;
}
