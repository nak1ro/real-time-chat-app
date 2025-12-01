import { api } from './axios';

export const invitationApi = {
    accept: async (invitationId: string) => {
        const response = await api.post<{ conversationId: string }>(`/invitations/${invitationId}/accept`);
        return response.data;
    },

    decline: async (invitationId: string) => {
        const response = await api.post<{ success: boolean }>(`/invitations/${invitationId}/decline`);
        return response.data;
    },
};
