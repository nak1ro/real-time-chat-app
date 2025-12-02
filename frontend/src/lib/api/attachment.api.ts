import { apiClient } from './api-client';
import type { Attachment, UploadAttachmentResponse, AttachmentsResponse } from '@/types';

export const attachmentApi = {
  // Upload an attachment file
  upload: (file: File): Promise<UploadAttachmentResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<UploadAttachmentResponse>('/api/attachments/upload', formData);
  },

  // Get attachments for a message
  getForMessage: async (messageId: string): Promise<Attachment[]> => {
    const res = await apiClient
        .get<AttachmentsResponse>(`/api/messages/${messageId}/attachments`);
    return res.attachments;
  },
};
