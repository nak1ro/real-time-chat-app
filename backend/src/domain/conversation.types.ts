import { Conversation, ConversationMember, MemberRole } from '@prisma/client';

/**
 * Conversation with members
 */
export interface ConversationWithMembers extends Conversation {
  members: ConversationMember[];
}

/**
 * Create Direct Conversation Data
 */
export interface CreateDirectConversationData {
  currentUserId: string;
  otherUserId: string;
}

/**
 * Create Conversation Data
 */
export interface CreateConversationData {
  name: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  description?: string;
  slug?: string;
  isPublic?: boolean;
  isReadOnly?: boolean;
  avatarUrl?: string;
  createdById?: string;
}

/**
 * Create Conversation Member Data
 */
export interface CreateConversationMemberData {
  userId: string;
  conversationId: string;
  role?: MemberRole;
}

