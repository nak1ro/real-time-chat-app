# API Modules

This directory contains typed API modules for interacting with the backend. Each module corresponds to a specific domain and provides type-safe methods for making HTTP requests.

## Structure

```
lib/api/
├── api-client.ts          # Base HTTP client with interceptors
├── auth.api.ts            # Authentication endpoints
├── user.api.ts            # User management endpoints
├── conversation.api.ts    # Conversation/channel endpoints
├── message.api.ts         # Message CRUD endpoints
├── attachment.api.ts      # File upload endpoints
├── reaction.api.ts        # Message reactions
├── mention.api.ts         # User mentions
├── receipt.api.ts         # Read receipts
├── notification.api.ts    # Notifications
├── moderation.api.ts      # Moderation actions
└── index.ts               # Aggregated exports
```

## Usage

### Basic Import

```typescript
import { api } from '@/lib/api';

// Use domain-specific API
const user = await api.users.getCurrentUser();
const conversations = await api.conversations.listUserConversations();
```

### Individual Module Import

```typescript
import { authApi, userApi, conversationApi } from '@/lib/api';

// Login
const { user, token } = await authApi.login({ name: 'john', password: 'secret' });

// Get user info
const currentUser = await userApi.getCurrentUser();

// Create conversation
const conversation = await conversationApi.createDirectConversation({
  otherUserId: 'user-id-123',
});
```

## API Client

The `apiClient` is a wrapper around the native `fetch` API with the following features:

- **Automatic authentication**: Adds JWT token to requests
- **Response parsing**: Unwraps backend response format (`{ status, data }`)
- **Error handling**: Throws typed `ApiClientError` with status codes
- **Token management**: Clears expired tokens and redirects to login on 401
- **Request config**: Supports query params, custom headers, and auth bypass

### API Client Methods

```typescript
// GET request
apiClient.get<T>(endpoint, config?)

// POST request
apiClient.post<T>(endpoint, body?, config?)

// PATCH request
apiClient.patch<T>(endpoint, body?, config?)

// PUT request
apiClient.put<T>(endpoint, body?, config?)

// DELETE request
apiClient.delete<T>(endpoint, config?)

// File upload (multipart/form-data)
apiClient.upload<T>(endpoint, formData, config?)
```

### Request Configuration

```typescript
interface RequestConfig {
  params?: Record<string, string | number | boolean | undefined>;
  requiresAuth?: boolean; // Default: true
  headers?: HeadersInit;
  // ... other fetch options
}
```

### Error Handling

```typescript
import { ApiClientError } from '@/lib/api';

try {
  await api.auth.login({ name: 'john', password: 'wrong' });
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error('Status:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Validation errors:', error.errors);
  }
}
```

## Domain APIs

### Auth API

```typescript
// Register
const { user, token } = await api.auth.register({
  name: 'john',
  password: 'secret123',
  avatarUrl: 'https://...',
});

// Login
const { user, token } = await api.auth.login({
  name: 'john',
  password: 'secret123',
});

// Get current user
const { user } = await api.auth.getCurrentUser();

// Refresh token
const { token } = await api.auth.refreshToken();

// Logout
await api.auth.logout();
```

### User API

```typescript
// Get current user
const user = await api.users.getCurrentUser();

// Update current user
const updatedUser = await api.users.updateCurrentUser({
  name: 'John Doe',
  status: Status.ONLINE,
});

// Get user by ID
const user = await api.users.getUserById('user-id');

// Search users
const users = await api.users.searchUsers({ q: 'john', limit: 20 });

// Get user presence
const presence = await api.users.getUserPresence('user-id');

// Get bulk presences
const { presences } = await api.users.getBulkPresences({
  userIds: ['user-1', 'user-2'],
});
```

### Conversation API

```typescript
// Create direct conversation
const conversation = await api.conversations.createDirectConversation({
  otherUserId: 'user-id',
});

// Create group/channel
const conversation = await api.conversations.createGroupOrChannel({
  name: 'My Channel',
  type: ConversationType.CHANNEL,
  isPublic: true,
  slug: 'my-channel',
});

// List user conversations
const conversations = await api.conversations.listUserConversations({
  type: ConversationType.CHANNEL,
});

// Get conversation by ID
const conversation = await api.conversations.getConversationById('conv-id');

// Update conversation
const updated = await api.conversations.updateConversation('conv-id', {
  name: 'New Name',
  description: 'Updated description',
});

// Add members
await api.conversations.addMembers('conv-id', {
  userIds: ['user-1', 'user-2'],
  role: MemberRole.MEMBER,
});

// Remove member
await api.conversations.removeMember('conv-id', 'member-id');

// Leave conversation
await api.conversations.leaveConversation('conv-id');

// Update member role
await api.conversations.updateMemberRole('conv-id', 'member-id', {
  role: MemberRole.ADMIN,
});

// List public channels
const channels = await api.conversations.listPublicChannels();

// Join channel by slug
const { conversation } = await api.conversations.joinChannelBySlug('general');

// Generate slug
const { slug } = await api.conversations.generateSlug({ name: 'My Channel' });
```

### Message API

```typescript
// Create message
const { message, mentionedUserIds } = await api.messages.createMessage({
  conversationId: 'conv-id',
  text: 'Hello @john',
  replyToId: 'msg-id', // optional
  attachments: [], // optional
});

// Get conversation messages (paginated)
const { messages, nextCursor, hasMore } = await api.messages.getConversationMessages(
  'conv-id',
  {
    limit: 50,
    cursor: 'cursor-token',
    sortOrder: 'desc',
  }
);

// Edit message
const message = await api.messages.editMessage('msg-id', {
  text: 'Updated text',
});

// Delete message
const message = await api.messages.deleteMessage('msg-id');
```

### Attachment API

```typescript
// Upload attachment
const file = new File([...], 'image.jpg', { type: 'image/jpeg' });
const attachment = await api.attachments.uploadAttachment(file);

// Get message attachments
const attachments = await api.attachments.getMessageAttachments('msg-id');
```

### Reaction API

```typescript
// Toggle reaction
const { action, reaction } = await api.reactions.toggleReaction('msg-id', {
  emoji: '👍',
});

// Get message reactions
const { reactions } = await api.reactions.getMessageReactions('msg-id');
```

### Mention API

```typescript
// Get user mentions
const { mentions, nextCursor, hasMore } = await api.mentions.getUserMentions({
  limit: 20,
  cursor: 'cursor-token',
});
```

### Receipt API

```typescript
// Mark messages as read
const { messagesAffected } = await api.receipts.markMessagesAsRead('conv-id', {
  lastReadMessageId: 'msg-id',
});

// Get message read stats
const { stats } = await api.receipts.getMessageReadStats('msg-id');

// Get unread count
const { conversationId, unreadCount } = await api.receipts.getUnreadCount('conv-id');
```

### Notification API

```typescript
// Get notifications
const { notifications, nextCursor, hasMore } = await api.notifications.getUserNotifications({
  limit: 20,
  unreadOnly: true,
});

// Get unread count
const { unreadCount } = await api.notifications.getUnreadNotificationCount();

// Mark as read
const { notification } = await api.notifications.markAsRead('notif-id');

// Mark all as read
const { count } = await api.notifications.markAllAsRead();

// Mark conversation notifications as read
const { count } = await api.notifications.markConversationAsRead('conv-id');
```

### Moderation API

```typescript
// Apply moderation action
const { moderationAction } = await api.moderation.applyModerationAction('conv-id', {
  action: ModerationActionType.MUTE,
  targetUserId: 'user-id',
  reason: 'Spamming',
  durationMinutes: 60,
});

// Get active mute
const { mute } = await api.moderation.getActiveMute('conv-id', 'user-id');
```

## Types

All request/response types are defined in `src/types/` and are fully typed:

```typescript
import type {
  User,
  Conversation,
  Message,
  Notification,
  // ... and many more
} from '@/types';
```

## Integration with React Query

These API modules are designed to work seamlessly with React Query:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Query
const { data: user } = useQuery({
  queryKey: ['user', 'current'],
  queryFn: () => api.users.getCurrentUser(),
});

// Mutation
const { mutate: sendMessage } = useMutation({
  mutationFn: (data: CreateMessageDto) => api.messages.createMessage(data),
  onSuccess: (data) => {
    // Handle success
  },
});
```

## Environment Configuration

API base URL is configured in `src/config/env.ts`:

```typescript
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  // ...
};
```

Set the environment variable in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Notes

- All API calls require authentication by default (except register/login)
- The JWT token is automatically added to request headers
- Expired tokens (401 responses) trigger automatic logout and redirect to `/login`
- All dates in responses are returned as `Date` objects (parsed by the client)
- The backend uses a standard response format: `{ status: 'success', data: {...} }`
- The API client automatically unwraps the `data` field from responses

