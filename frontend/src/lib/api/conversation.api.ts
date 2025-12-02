import {apiClient} from './api-client';
import type {
    AddMembersData,
    Conversation,
    ConversationFilters,
    ConversationResponse,
    ConversationsListResponse,
    CreateConversationData,
    CreateDirectConversationData,
    GenerateSlugData,
    LeaveConversationResponse,
    PublicChannelsResponse,
    SlugResponse,
    UpdateConversationPatch,
    UpdateMemberRoleData,
} from '@/types';
import type {User} from '@/types/user.types';

export const conversationApi = {
    // Create a direct (1-on-1) conversation
    createDirect: async (data: CreateDirectConversationData): Promise<Conversation> => {
        const res = await apiClient
            .post<ConversationResponse>('/api/conversations/direct', data);
        return res.conversation;
    },

    // Create a group or channel conversation
    create: async (data: CreateConversationData): Promise<Conversation> => {
        const res = await apiClient
            .post<ConversationResponse>('/api/conversations', data);
        return res.conversation;
    },

    // List all conversations for current user
    list: async (filters?: ConversationFilters): Promise<Conversation[]> => {
        const res = await apiClient
            .get<ConversationsListResponse>('/api/conversations', {params: filters as any});
        return res.conversations;
    },

    // Get conversation by ID
    getById: async (id: string): Promise<Conversation> => {
        const res = await apiClient
            .get<ConversationResponse>(`/api/conversations/${id}`);
        return res.conversation;
    },

    // Update conversation details
    update: async (id: string, data: UpdateConversationPatch): Promise<Conversation> => {
        const res = await apiClient
            .patch<ConversationResponse>(`/api/conversations/${id}`, data);
        return res.conversation;
    },

    // Add members to a conversation
    addMembers: async (id: string, data: AddMembersData): Promise<Conversation> => {
        const res = await apiClient
            .post<ConversationResponse>(`/api/conversations/${id}/members`, data);
        return res.conversation;
    },

    // Remove a member from a conversation
    removeMember: async (id: string, memberId: string): Promise<Conversation> => {
        const res = await apiClient
            .delete<ConversationResponse>(`/api/conversations/${id}/members/${memberId}`);
        return res.conversation;
    },

    // Leave a conversation
    leave: (id: string): Promise<LeaveConversationResponse> => {
        return apiClient.post<LeaveConversationResponse>(`/api/conversations/${id}/leave`);
    },

    // Update a member's role in a conversation
    updateMemberRole: async (id: string, memberId: string, data: UpdateMemberRoleData): Promise<Conversation> => {
        const res = await apiClient
            .patch<ConversationResponse>(`/api/conversations/${id}/members/${memberId}/role`, data);
        return res.conversation;
    },

    // List all public channels
    listPublic: async (filters?: { name?: string }): Promise<Conversation[]> => {
        const res = await apiClient
            .get<PublicChannelsResponse>('/api/conversations/public', {params: filters as any});
        return res.channels;
    },

    // Join a public channel by slug
    joinBySlug: async (slug: string): Promise<Conversation> => {
        const res = await apiClient
            .post<ConversationResponse>(`/api/conversations/public/${slug}/join`);
        return res.conversation;
    },

    // Generate a unique slug from a name
    generateSlug: async (data: GenerateSlugData): Promise<string> => {
        const res = await apiClient
            .post<SlugResponse>('/api/conversations/slug', data);
        return res.slug;
    },

    // Search conversations and users
    search: (
        query: string,
        type?: string
    ): Promise<{ conversations: Conversation[]; users: User[] }> => {
        // Map DIRECT to USER for search endpoint
        const searchType = type === 'DIRECT' ? 'USER' : type;

        return apiClient.get<{ conversations: Conversation[]; users: User[] }>(
            '/api/conversations/search',
            {
                params: { q: query, type: searchType },
            }
        );
    },

    // Get attachments for a conversation
    getAttachments: async (
        id: string,
        params?: { type?: string; cursor?: string; limit?: number }
    ): Promise<{ attachments: any[]; nextCursor: string | null; hasMore: boolean }> => {
        return await apiClient
            .get<{ attachments: any[]; nextCursor: string | null; hasMore: boolean; }>(
                `/api/conversations/${id}/attachments`,
                {params}
            );
    },

    // Delete a conversation
    delete: (id: string): Promise<void> => {
        return apiClient.delete(`/api/conversations/${id}`);
    },
};
