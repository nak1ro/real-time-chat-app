import { apiClient } from './api-client';

export interface AcceptInvitationResponse {
    conversationId: string;
    conversation: {
        id: string;
        name: string;
        type: string;
    };
}

export interface DeclineInvitationResponse {
    message: string;
}

export interface CreateInvitationsResponse {
    invitations: Array<{
        id: string;
        conversationId: string;
        senderId: string;
        recipientId: string;
        status: string;
    }>;
    count: number;
}

export const invitationApi = {
    create: async (conversationId: string, recipientIds: string[]) => {
        return await apiClient.post<CreateInvitationsResponse>(
            `/api/conversations/${conversationId}/invitations`,
            { recipientIds }
        );
    },

    accept: async (invitationId: string) => {
        return await apiClient.post<AcceptInvitationResponse>(`/api/invitations/${invitationId}/accept`);
    },

    decline: async (invitationId: string) => {
        return await apiClient.post<DeclineInvitationResponse>(`/api/invitations/${invitationId}/decline`);
    },
};
