// Conversation API - handles conversation-related API calls
import { apiClient } from './api-client';
import type {
  Conversation,
  CreateDirectConversationDto,
  CreateConversationDto,
  UpdateConversationDto,
  ConversationFilters,
  AddMembersDto,
  UpdateMemberRoleDto,
  GenerateSlugDto,
  SlugResponse,
  JoinChannelResponse,
} from '@/types';

export const conversationApi = {
  // Create direct conversation
  createDirectConversation: (data: CreateDirectConversationDto) => {
    return apiClient.post<{ conversation: Conversation }>('/api/conversations/direct', data).then((res) => res.conversation);
  },

  // Create group or channel conversation
  createGroupOrChannel: (data: CreateConversationDto) => {
    return apiClient.post<{ conversation: Conversation }>('/api/conversations', data).then((res) => res.conversation);
  },

  // List user's conversations
  listUserConversations: (filters?: ConversationFilters) => {
    return apiClient.get<{ conversations: Conversation[] }>('/api/conversations', { params: filters as any }).then((res) => res.conversations);
  },

  // Get conversation by ID
  getConversationById: (conversationId: string) => {
    return apiClient.get<{ conversation: Conversation }>(`/api/conversations/${conversationId}`).then((res) => res.conversation);
  },

  // Update conversation
  updateConversation: (conversationId: string, data: UpdateConversationDto) => {
    return apiClient.patch<{ conversation: Conversation }>(`/api/conversations/${conversationId}`, data).then((res) => res.conversation);
  },

  // Add members to conversation
  addMembers: (conversationId: string, data: AddMembersDto) => {
    return apiClient.post<{ conversation: Conversation }>(`/api/conversations/${conversationId}/members`, data).then((res) => res.conversation);
  },

  // Remove member from conversation
  removeMember: (conversationId: string, memberId: string) => {
    return apiClient.delete<{ conversation: Conversation }>(`/api/conversations/${conversationId}/members/${memberId}`).then((res) => res.conversation);
  },

  // Leave conversation
  leaveConversation: (conversationId: string) => {
    return apiClient.post<{ message: string }>(`/api/conversations/${conversationId}/leave`);
  },

  // Update member role
  updateMemberRole: (conversationId: string, memberId: string, data: UpdateMemberRoleDto) => {
    return apiClient.patch<{ conversation: Conversation }>(`/api/conversations/${conversationId}/members/${memberId}/role`, data).then((res) => res.conversation);
  },

  // List public channels
  listPublicChannels: (filters?: ConversationFilters) => {
    return apiClient.get<{ channels: Conversation[] }>('/api/conversations/public', { params: filters as any }).then((res) => res.channels);
  },

  // Join channel by slug
  joinChannelBySlug: (slug: string) => {
    return apiClient.post<JoinChannelResponse>(`/api/conversations/public/${slug}/join`);
  },

  // Generate slug from name
  generateSlug: (data: GenerateSlugDto) => {
    return apiClient.post<SlugResponse>('/api/conversations/slug', data);
  },
};

