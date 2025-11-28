import {apiClient} from './api-client';
import type {
    Conversation,
    CreateDirectConversationData,
    CreateConversationData,
    UpdateConversationPatch,
    ConversationFilters,
    AddMembersData,
    UpdateMemberRoleData,
    GenerateSlugData,
    ConversationResponse,
    ConversationsListResponse,
    PublicChannelsResponse,
    SlugResponse,
    LeaveConversationResponse,
} from '@/types';
import type {User} from '@/types/user.types';

export const conversationApi = {
    // Create a direct (1-on-1) conversation
    createDirect: (data: CreateDirectConversationData): Promise<Conversation> => {
        return apiClient
            .post<ConversationResponse>('/api/conversations/direct', data)
            .then((res) => res.conversation);
    },

    // Create a group or channel conversation
    create: (data: CreateConversationData): Promise<Conversation> => {
        return apiClient
            .post<ConversationResponse>('/api/conversations', data)
            .then((res) => res.conversation);
    },

    // List all conversations for current user
    list: (filters?: ConversationFilters): Promise<Conversation[]> => {
        return apiClient
            .get<ConversationsListResponse>('/api/conversations', {params: filters as any})
            .then((res) => res.conversations);
    },

    // Get conversation by ID
    getById: (id: string): Promise<Conversation> => {
        return apiClient
            .get<ConversationResponse>(`/api/conversations/${id}`)
            .then((res) => res.conversation);
    },

    // Update conversation details
    update: (id: string, data: UpdateConversationPatch): Promise<Conversation> => {
        return apiClient
            .patch<ConversationResponse>(`/api/conversations/${id}`, data)
            .then((res) => res.conversation);
    },

    // Add members to a conversation
    addMembers: (id: string, data: AddMembersData): Promise<Conversation> => {
        return apiClient
            .post<ConversationResponse>(`/api/conversations/${id}/members`, data)
            .then((res) => res.conversation);
    },

    // Remove a member from a conversation
    removeMember: (id: string, memberId: string): Promise<Conversation> => {
        return apiClient
            .delete<ConversationResponse>(`/api/conversations/${id}/members/${memberId}`)
            .then((res) => res.conversation);
    },

    // Leave a conversation
    leave: (id: string): Promise<LeaveConversationResponse> => {
        return apiClient.post<LeaveConversationResponse>(`/api/conversations/${id}/leave`);
    },

    // Update a member's role in a conversation
    updateMemberRole: (id: string, memberId: string, data: UpdateMemberRoleData): Promise<Conversation> => {
        return apiClient
            .patch<ConversationResponse>(`/api/conversations/${id}/members/${memberId}/role`, data)
            .then((res) => res.conversation);
    },

    // List all public channels
    listPublic: (filters?: { name?: string }): Promise<Conversation[]> => {
        return apiClient
            .get<PublicChannelsResponse>('/api/conversations/public', {params: filters as any})
            .then((res) => res.channels);
    },

    // Join a public channel by slug
    joinBySlug: (slug: string): Promise<Conversation> => {
        return apiClient
            .post<ConversationResponse>(`/api/conversations/public/${slug}/join`)
            .then((res) => res.conversation);
    },

    // Generate a unique slug from a name
    generateSlug: (data: GenerateSlugData): Promise<string> => {
        return apiClient
            .post<SlugResponse>('/api/conversations/slug', data)
            .then((res) => res.slug);
    },

    // Search conversations and users
    search: (
        query: string,
        type?: string
    ): Promise<{ conversations: Conversation[]; users: User[] }> => {
        return apiClient.get<{ conversations: Conversation[]; users: User[] }>(
            '/api/conversations/search',
            {
                params: {q: query, type},
            }
        );
    },
};
