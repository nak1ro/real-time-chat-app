// API Module Exports - central export for all API modules

// Export API client
export { apiClient, ApiClientError } from './api-client';
export type { RequestConfig } from './api-client';

// Export API modules
export { authApi } from './auth.api';
export { userApi } from './user.api';
export { conversationApi } from './conversation.api';
export { messageApi } from './message.api';
export { attachmentApi } from './attachment.api';
export { reactionApi } from './reaction.api';

export { receiptApi } from './receipt.api';
export { notificationApi } from './notification.api';
export { moderationApi } from './moderation.api';
export { invitationApi } from './invitation.api';

// Import for aggregated object
import { authApi } from './auth.api';
import { userApi } from './user.api';
import { conversationApi } from './conversation.api';
import { messageApi } from './message.api';
import { attachmentApi } from './attachment.api';
import { reactionApi } from './reaction.api';

import { receiptApi } from './receipt.api';
import { notificationApi } from './notification.api';
import { moderationApi } from './moderation.api';
import { invitationApi } from './invitation.api';

// Aggregated API object for convenience
