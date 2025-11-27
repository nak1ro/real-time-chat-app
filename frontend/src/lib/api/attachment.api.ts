// Attachment API - handles file attachment-related API calls
import { apiClient } from './api-client';
import type { Attachment } from '@/types';

export const attachmentApi = {
  // Upload an attachment
  uploadAttachment: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.upload<{ attachment: Attachment }>('/messages/attachments/upload', formData).then((res) => res.attachment);
  },

  // Get message attachments
  getMessageAttachments: (messageId: string) => {
    return apiClient.get<{ attachments: Attachment[] }>(`/messages/messages/${messageId}/attachments`).then((res) => res.attachments);
  },
};

