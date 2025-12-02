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

export const invitationApi = {
    accept: async (invitationId: string) => {
        const response = await apiClient.post<{ status: string; data: AcceptInvitationResponse }>(`/api/invitations/${invitationId}/accept`);
        return response.data;
    },

    decline: async (invitationId: string) => {
        const response = await apiClient.post<{ status: string; data: DeclineInvitationResponse }>(`/api/invitations/${invitationId}/decline`);
        return response.data;
    },
};
