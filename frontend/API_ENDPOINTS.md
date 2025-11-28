# API Endpoints Documentation

This document provides a comprehensive overview of all API endpoints in the real-time chat application backend.

**Base URL**: `/api`

All endpoints return responses in the following format:
```json
{
  "status": "success" | "error",
  "data": { ... }
}
```

---

## Authentication

**Base Path**: `/api/auth`

All authentication endpoints except `/register` and `/login` require a valid JWT token in the `Authorization` header.

### POST /api/auth/register
**Description**: Register a new user account

**Authentication**: Not required

**Request Body**: `RegisterDto`
- `name`: string (required) - Unique username
- `password`: string (required) - User password (min 6 characters)
- `avatarUrl`: string (optional) - URL to user's avatar image

**Response**: `AuthResponse`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "avatarUrl": "string | null",
      "status": "string | null",
      "lastSeenAt": "Date | null",
      "createdAt": "Date"
    },
    "token": "string"
  }
}
```

---

### POST /api/auth/login
**Description**: Authenticate user and receive JWT token

**Authentication**: Not required

**Request Body**: `LoginDto`
- `name`: string (required) - Username
- `password`: string (required) - User password

**Response**: `AuthResponse`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "avatarUrl": "string | null",
      "status": "string | null",
      "lastSeenAt": "Date | null",
      "createdAt": "Date"
    },
    "token": "string"
  }
}
```

---

### GET /api/auth/me
**Description**: Get current authenticated user information

**Authentication**: Required

**Request Body**: None

**Response**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "avatarUrl": "string | null",
      "status": "string | null",
      "lastSeenAt": "Date | null",
      "createdAt": "Date"
    }
  }
}
```

---

### POST /api/auth/refresh
**Description**: Refresh JWT authentication token

**Authentication**: Required

**Request Body**: None

**Response**:
```json
{
  "status": "success",
  "data": {
    "token": "string"
  }
}
```

---

### POST /api/auth/logout
**Description**: Logout user (client-side cleanup)

**Authentication**: Required

**Request Body**: None

**Response**:
```json
{
  "status": "success",
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## User Management

**Base Path**: `/api/users`

All user endpoints require authentication.

### GET /api/users/me
**Description**: Get current user profile

**Authentication**: Required

**Request Body**: None

**Response**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "avatarUrl": "string | null",
      "status": "Status | null",
      "lastSeenAt": "Date | null",
      "createdAt": "Date"
    }
  }
}
```

---

### PATCH /api/users/me
**Description**: Update current user profile

**Authentication**: Required

**Request Body**: multipart/form-data
- `name`: string (optional) - New username
- `avatar`: File (optional) - Avatar image file (max 5MB)
  - Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

**Response**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "avatarUrl": "string | null",
      "status": "Status | null",
      "lastSeenAt": "Date | null",
      "createdAt": "Date"
    }
  }
}
```

---

### GET /api/users/search
**Description**: Search for users by name

**Authentication**: Required

**Query Parameters**:
- `query`: string (required) - Search query string

**Response**:
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "string",
        "name": "string",
        "avatarUrl": "string | null",
        "status": "Status | null",
        "lastSeenAt": "Date | null",
        "createdAt": "Date"
      }
    ]
  }
}
```

---

### GET /api/users/:id
**Description**: Get user by ID

**Authentication**: Required

**Path Parameters**:
- `id`: string - User ID

**Response**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "avatarUrl": "string | null",
      "status": "Status | null",
      "lastSeenAt": "Date | null",
      "createdAt": "Date"
    }
  }
}
```

---

## User Presence

**Base Path**: `/api/users`

### GET /api/users/:userId/presence
**Description**: Get presence status for a specific user

**Authentication**: Required

**Path Parameters**:
- `userId`: string - User ID to check presence for

**Response**:
```json
{
  "status": "success",
  "data": {
    "status": {
      "userId": "string",
      "status": "ONLINE | OFFLINE | AWAY",
      "lastSeenAt": "Date | null"
    }
  }
}
```

---

### POST /api/users/presence/bulk
**Description**: Get presence status for multiple users

**Authentication**: Required

**Request Body**:
- `userIds`: string[] (required) - Array of user IDs

**Response**:
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "userId": "string",
        "status": "ONLINE | OFFLINE | AWAY",
        "lastSeenAt": "Date | null"
      }
    ]
  }
}
```

---

### POST /api/users/presence/heartbeat
**Description**: Update user's last seen timestamp

**Authentication**: Required

**Request Body**: None

**Response**:
```json
{
  "status": "success",
  "data": {
    "message": "Heartbeat updated"
  }
}
```

---

## User Permissions

**Base Path**: `/api/users`

### GET /api/users/permissions
**Description**: Check user permissions for specific actions

**Authentication**: Required

**Query Parameters**:
- `conversationId`: string (required) - Conversation ID to check permissions for
- `action`: string (required) - Action to check: `sendMessage`, `manageMembers`, or `moderateMessage`

**Response**:
```json
{
  "status": "success",
  "data": {
    "canPerform": "boolean"
  }
}
```

---

## Conversations

**Base Path**: `/api/conversations`

All conversation endpoints require authentication.

### POST /api/conversations/direct
**Description**: Create a direct (1-on-1) conversation

**Authentication**: Required

**Request Body**:
- `otherUserId`: string (required) - ID of the other user

**Response**:
```json
{
  "status": "success",
  "data": {
    "conversation": {
      "id": "string",
      "type": "DIRECT",
      "name": "string | null",
      "slug": "string | null",
      "description": "string | null",
      "avatarUrl": "string | null",
      "isPublic": "boolean",
      "isReadOnly": "boolean",
      "createdAt": "Date",
      "members": [...]
    }
  }
}
```

---

### POST /api/conversations
**Description**: Create a group or channel conversation

**Authentication**: Required

**Request Body**: `CreateConversationData`
- `name`: string (required) - Conversation name
- `type`: string (required) - `GROUP` or `CHANNEL`
- `description`: string (optional) - Conversation description
- `slug`: string (optional) - URL-friendly identifier for channels
- `isPublic`: boolean (optional) - Whether channel is publicly discoverable (default: false)
- `isReadOnly`: boolean (optional) - Whether only admins/moderators can post (default: false)
- `avatarUrl`: string (optional) - Conversation avatar URL

**Response**:
```json
{
  "status": "success",
  "data": {
    "conversation": {
      "id": "string",
      "type": "GROUP | CHANNEL",
      "name": "string",
      "slug": "string | null",
      "description": "string | null",
      "avatarUrl": "string | null",
      "isPublic": "boolean",
      "isReadOnly": "boolean",
      "createdAt": "Date",
      "members": [...]
    }
  }
}
```

---

### GET /api/conversations
**Description**: List all conversations for current user

**Authentication**: Required

**Query Parameters**:
- `type`: string (optional) - Filter by type: `DIRECT`, `GROUP`, or `CHANNEL`
- `isPublic`: boolean (optional) - Filter by public status
- `name`: string (optional) - Filter by name (partial match)

**Response**:
```json
{
  "status": "success",
  "data": {
    "conversations": [
      {
        "id": "string",
        "type": "DIRECT | GROUP | CHANNEL",
        "name": "string | null",
        "slug": "string | null",
        "description": "string | null",
        "avatarUrl": "string | null",
        "isPublic": "boolean",
        "isReadOnly": "boolean",
        "createdAt": "Date",
        "members": [...]
      }
    ]
  }
}
```

---

### GET /api/conversations/search
**Description**: Search for public conversations and users by name

**Authentication**: Required

**Query Parameters**:
- `q`: string (required) - Search query string
- `type`: string (optional) - Filter by conversation type: `DIRECT`, `GROUP`, `CHANNEL`. If omitted, searches all public conversations and users.

**Response**:
```json
{
  "status": "success",
  "data": {
    "conversations": [
      {
        "id": "string",
        "type": "DIRECT | GROUP | CHANNEL",
        "name": "string | null",
        "slug": "string | null",
        "description": "string | null",
        "avatarUrl": "string | null",
        "isPublic": "boolean",
        "isReadOnly": "boolean",
        "createdAt": "Date",
        "members": [...]
      }
    ],
    "users": [
      {
        "id": "string",
        "name": "string",
        "avatarUrl": "string | null",
        "status": "Status | null",
        "lastSeenAt": "Date | null",
        "createdAt": "Date"
      }
    ]
  }
}
```

---

### GET /api/conversations/:id
**Description**: Get conversation by ID

**Authentication**: Required

**Path Parameters**:
- `id`: string - Conversation ID

**Response**:
```json
{
  "status": "success",
  "data": {
    "conversation": {
      "id": "string",
      "type": "DIRECT | GROUP | CHANNEL",
      "name": "string | null",
      "slug": "string | null",
      "description": "string | null",
      "avatarUrl": "string | null",
      "isPublic": "boolean",
      "isReadOnly": "boolean",
      "createdAt": "Date",
      "members": [...]
    }
  }
}
```

---

### PATCH /api/conversations/:id
**Description**: Update conversation details

**Authentication**: Required (requires admin/moderator role)

**Path Parameters**:
- `id`: string - Conversation ID

**Request Body**: `UpdateConversationPatch`
- `name`: string (optional) - New conversation name
- `description`: string (optional) - New description
- `avatarUrl`: string (optional) - New avatar URL
- `isPublic`: boolean (optional) - Update public visibility
- `isReadOnly`: boolean (optional) - Update read-only status

**Response**:
```json
{
  "status": "success",
  "data": {
    "conversation": { ... }
  }
}
```

---

### POST /api/conversations/:id/members
**Description**: Add members to a conversation

**Authentication**: Required (requires admin/moderator role)

**Path Parameters**:
- `id`: string - Conversation ID

**Request Body**:
- `userIds`: string[] (required) - Array of user IDs to add
- `role`: string (optional) - Member role: `MEMBER`, `MODERATOR`, or `ADMIN` (default: MEMBER)

**Response**:
```json
{
  "status": "success",
  "data": {
    "conversation": { ... }
  }
}
```

---

### DELETE /api/conversations/:id/members/:memberId
**Description**: Remove a member from a conversation

**Authentication**: Required (requires admin/moderator role)

**Path Parameters**:
- `id`: string - Conversation ID
- `memberId`: string - User ID of member to remove

**Response**:
```json
{
  "status": "success",
  "data": {
    "conversation": { ... }
  }
}
```

---

### POST /api/conversations/:id/leave
**Description**: Leave a conversation

**Authentication**: Required

**Path Parameters**:
- `id`: string - Conversation ID

**Response**:
```json
{
  "status": "success",
  "data": {
    "message": "Left conversation successfully"
  }
}
```

---

### PATCH /api/conversations/:id/members/:memberId/role
**Description**: Update a member's role in a conversation

**Authentication**: Required (requires admin role)

**Path Parameters**:
- `id`: string - Conversation ID
- `memberId`: string - User ID of member to update

**Request Body**:
- `role`: string (required) - New role: `MEMBER`, `MODERATOR`, or `ADMIN`

**Response**:
```json
{
  "status": "success",
  "data": {
    "conversation": { ... }
  }
}
```

---

### GET /api/conversations/public
**Description**: List all public channels

**Authentication**: Required

**Query Parameters**:
- `name`: string (optional) - Filter by name (partial match)

**Response**:
```json
{
  "status": "success",
  "data": {
    "channels": [
      {
        "id": "string",
        "type": "CHANNEL",
        "name": "string",
        "slug": "string",
        "description": "string | null",
        "avatarUrl": "string | null",
        "isPublic": true,
        "isReadOnly": "boolean",
        "createdAt": "Date",
        "members": [...]
      }
    ]
  }
}
```

---

### POST /api/conversations/public/:slug/join
**Description**: Join a public channel by its slug

**Authentication**: Required

**Path Parameters**:
- `slug`: string - Channel slug

**Response**:
```json
{
  "status": "success",
  "data": {
    "conversation": { ... }
  }
}
```

---

### POST /api/conversations/slug
**Description**: Generate a unique slug from a channel name

**Authentication**: Required

**Request Body**:
- `name`: string (required) - Channel name to convert to slug

**Response**:
```json
{
  "status": "success",
  "data": {
    "slug": "string"
  }
}
```

---

## Conversation Moderation

**Base Path**: `/api/conversations`

### POST /api/conversations/:id/moderation
**Description**: Apply moderation action to a user or message

**Authentication**: Required (requires admin/moderator role)

**Path Parameters**:
- `id`: string - Conversation ID

**Request Body**:
- `action`: string (required) - Moderation action: `MUTE_USER`, `KICK_USER`, `BAN_USER`, `DELETE_MESSAGE`
- `targetUserId`: string (optional) - User ID for user-based actions
- `messageId`: string (optional) - Message ID for message-based actions
- `reason`: string (optional) - Reason for moderation action
- `expiresAt`: string (optional) - ISO date string for temporary actions

**Response**:
```json
{
  "status": "success",
  "data": {
    "message": "Moderation action {action} applied successfully"
  }
}
```

---

### GET /api/conversations/:id/moderation/mutes/:userId
**Description**: Get active mute status for a user in a conversation

**Authentication**: Required

**Path Parameters**:
- `id`: string - Conversation ID
- `userId`: string - User ID to check

**Response**:
```json
{
  "status": "success",
  "data": {
    "mute": {
      "id": "string",
      "conversationId": "string",
      "userId": "string",
      "expiresAt": "Date | null",
      "createdAt": "Date"
    } | null
  }
}
```

---

## Messages

**Base Path**: `/api`

All message endpoints require authentication.

### POST /api/messages
**Description**: Create a new message in a conversation

**Authentication**: Required

**Request Body**: `CreateMessageData`
- `conversationId`: string (required) - Conversation ID
- `text`: string (required) - Message text content
- `replyToId`: string (optional) - ID of message being replied to
- `attachments`: array (optional) - Array of attachment objects:
  - `url`: string (required) - Attachment URL
  - `thumbnailUrl`: string (optional) - Thumbnail URL for media
  - `fileName`: string (required) - Original file name
  - `mimeType`: string (required) - MIME type
  - `sizeBytes`: number (required) - File size in bytes
  - `type`: string (required) - Attachment type (image, video, audio, file)
  - `width`: number (optional) - Image/video width
  - `height`: number (optional) - Image/video height
  - `durationMs`: number (optional) - Audio/video duration in milliseconds

**Response**:
```json
{
  "status": "success",
  "data": {
    "message": {
      "id": "string",
      "conversationId": "string",
      "userId": "string",
      "text": "string",
      "replyToId": "string | null",
      "isEdited": "boolean",
      "isDeleted": "boolean",
      "createdAt": "Date",
      "updatedAt": "Date",
      "user": {
        "id": "string",
        "name": "string",
        "avatarUrl": "string | null",
        "status": "Status | null"
      },
      "replyTo": { ... } | null
    },
    "mentionedUserIds": ["string"]
  }
}
```

---

### GET /api/conversations/:id/messages
**Description**: Get messages in a conversation (paginated)

**Authentication**: Required

**Path Parameters**:
- `id`: string - Conversation ID

**Query Parameters**:
- `limit`: number (optional) - Number of messages to return (default: 50)
- `cursor`: string (optional) - Message ID to paginate from
- `sortOrder`: string (optional) - Sort order: `asc` or `desc` (default: desc)

**Response**: `PaginatedMessages`
```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "id": "string",
        "conversationId": "string",
        "userId": "string",
        "text": "string",
        "replyToId": "string | null",
        "isEdited": "boolean",
        "isDeleted": "boolean",
        "createdAt": "Date",
        "updatedAt": "Date",
        "user": { ... },
        "replyTo": { ... } | null,
        "_count": {
          "receipts": "number"
        }
      }
    ],
    "nextCursor": "string | null",
    "hasMore": "boolean",
    "total": "number"
  }
}
```

---

### PATCH /api/messages/:id
**Description**: Edit a message

**Authentication**: Required (must be message author)

**Path Parameters**:
- `id`: string - Message ID

**Request Body**:
- `text`: string (required) - New message text

**Response**:
```json
{
  "status": "success",
  "data": {
    "message": { ... }
  }
}
```

---

### DELETE /api/messages/:id
**Description**: Delete a message (soft delete)

**Authentication**: Required (must be message author or moderator)

**Path Parameters**:
- `id`: string - Message ID

**Response**:
```json
{
  "status": "success",
  "data": {
    "message": { ... }
  }
}
```

---

## Attachments

**Base Path**: `/api/attachments`

### POST /api/attachments/upload
**Description**: Upload an attachment file

**Authentication**: Required

**Request Body**: multipart/form-data
- `file`: File (required) - File to upload (max 50MB)

**Response**:
```json
{
  "status": "success",
  "data": {
    "attachment": {
      "url": "string",
      "thumbnailUrl": "string | null",
      "fileName": "string",
      "mimeType": "string",
      "sizeBytes": "number",
      "type": "string",
      "width": "number | null",
      "height": "number | null",
      "durationMs": "number | null"
    }
  }
}
```

---

### GET /api/messages/:id/attachments
**Description**: Get attachments for a specific message

**Authentication**: Required

**Path Parameters**:
- `id`: string - Message ID

**Response**:
```json
{
  "status": "success",
  "data": {
    "attachments": [
      {
        "id": "string",
        "messageId": "string",
        "url": "string",
        "thumbnailUrl": "string | null",
        "fileName": "string",
        "mimeType": "string",
        "sizeBytes": "number",
        "type": "string",
        "width": "number | null",
        "height": "number | null",
        "durationMs": "number | null",
        "createdAt": "Date"
      }
    ]
  }
}
```

---

## Mentions

**Base Path**: `/api/mentions`

### GET /api/mentions
**Description**: Get all mentions for the current user

**Authentication**: Required

**Query Parameters**:
- `limit`: number (optional) - Number of mentions to return
- `cursor`: string (optional) - Pagination cursor

**Response**:
```json
{
  "status": "success",
  "data": {
    "mentions": [
      {
        "id": "string",
        "messageId": "string",
        "userId": "string",
        "mentionedUserId": "string",
        "createdAt": "Date",
        "message": { ... }
      }
    ],
    "nextCursor": "string | null",
    "hasMore": "boolean"
  }
}
```

---

## Reactions

**Base Path**: `/api/messages`

### POST /api/messages/:id/reactions
**Description**: Toggle a reaction on a message (add if not present, remove if present)

**Authentication**: Required

**Path Parameters**:
- `id`: string - Message ID

**Request Body**:
- `emoji`: string (required) - Emoji character or code

**Response**:
```json
{
  "status": "success",
  "data": {
    "action": "added" | "removed",
    "reaction": {
      "id": "string",
      "messageId": "string",
      "userId": "string",
      "emoji": "string",
      "createdAt": "Date"
    } | null
  }
}
```

---

### GET /api/messages/:id/reactions
**Description**: Get all reactions for a message

**Authentication**: Required

**Path Parameters**:
- `id`: string - Message ID

**Response**:
```json
{
  "status": "success",
  "data": {
    "reactions": [
      {
        "id": "string",
        "messageId": "string",
        "userId": "string",
        "emoji": "string",
        "createdAt": "Date",
        "user": {
          "id": "string",
          "name": "string",
          "avatarUrl": "string | null"
        }
      }
    ]
  }
}
```

---

## Message Receipts (Read Status)

**Base Path**: `/api/conversations` and `/api/messages`

### POST /api/conversations/:id/read
**Description**: Mark messages as read in a conversation

**Authentication**: Required

**Path Parameters**:
- `id`: string - Conversation ID

**Request Body**:
- `upToMessageId`: string (required) - All messages up to and including this ID will be marked as read

**Response**: `BulkReceiptUpdate`
```json
{
  "status": "success",
  "data": {
    "conversationId": "string",
    "userId": "string",
    "lastReadMessageId": "string",
    "messagesAffected": "number",
    "timestamp": "Date"
  }
}
```

---

### GET /api/messages/:id/receipts
**Description**: Get read statistics for a specific message

**Authentication**: Required

**Path Parameters**:
- `id`: string - Message ID

**Response**: `MessageReadStats`
```json
{
  "status": "success",
  "data": {
    "messageId": "string",
    "totalRecipients": "number",
    "sentCount": "number",
    "deliveredCount": "number",
    "readCount": "number",
    "readBy": [
      {
        "userId": "string",
        "userName": "string",
        "seenAt": "Date | null"
      }
    ]
  }
}
```

---

### GET /api/conversations/:id/unread
**Description**: Get unread message count for a conversation

**Authentication**: Required

**Path Parameters**:
- `id`: string - Conversation ID

**Response**:
```json
{
  "status": "success",
  "data": {
    "unreadCount": "number"
  }
}
```

---

## Notifications

**Base Path**: `/api/notifications`

All notification endpoints require authentication.

### GET /api/notifications
**Description**: Get notifications for current user

**Authentication**: Required

**Query Parameters**:
- `limit`: number (optional) - Number of notifications to return
- `cursor`: string (optional) - Pagination cursor
- `unreadOnly`: boolean (optional) - Only return unread notifications (default: false)

**Response**:
```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "id": "string",
        "userId": "string",
        "type": "MENTION | REACTION | MESSAGE | SYSTEM",
        "title": "string",
        "content": "string",
        "isRead": "boolean",
        "relatedMessageId": "string | null",
        "relatedConversationId": "string | null",
        "relatedUserId": "string | null",
        "createdAt": "Date"
      }
    ],
    "nextCursor": "string | null",
    "hasMore": "boolean"
  }
}
```

---

### GET /api/notifications/unread/count
**Description**: Get count of unread notifications

**Authentication**: Required

**Response**:
```json
{
  "status": "success",
  "data": {
    "unreadCount": "number"
  }
}
```

---

### PATCH /api/notifications/:id/read
**Description**: Mark a specific notification as read

**Authentication**: Required

**Path Parameters**:
- `id`: string - Notification ID

**Response**:
```json
{
  "status": "success",
  "data": {
    "notification": { ... }
  }
}
```

---

### POST /api/notifications/read-all
**Description**: Mark all notifications as read

**Authentication**: Required

**Response**:
```json
{
  "status": "success",
  "data": {
    "message": "All notifications marked as read",
    "count": "number"
  }
}
```

---

### POST /api/conversations/:id/notifications/read
**Description**: Mark all notifications for a conversation as read

**Authentication**: Required

**Path Parameters**:
- `id`: string - Conversation ID

**Response**:
```json
{
  "status": "success",
  "data": {
    "message": "Conversation notifications marked as read",
    "count": "number"
  }
}
```

---

## Common Types & Enums

### Status (User Status)
```typescript
enum Status {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  AWAY = "AWAY"
}
```

### ConversationType
```typescript
enum ConversationType {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
  CHANNEL = "CHANNEL"
}
```

### MemberRole
```typescript
enum MemberRole {
  MEMBER = "MEMBER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN"
}
```

### ModerationActionType
```typescript
enum ModerationActionType {
  MUTE_USER = "MUTE_USER",
  KICK_USER = "KICK_USER",
  BAN_USER = "BAN_USER",
  DELETE_MESSAGE = "DELETE_MESSAGE"
}
```

### MessageDeliveryStatus
```typescript
enum MessageDeliveryStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ"
}
```

### NotificationType
```typescript
enum NotificationType {
  MENTION = "MENTION",
  REACTION = "REACTION",
  MESSAGE = "MESSAGE",
  SYSTEM = "SYSTEM"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE" // optional
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors, missing parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Authentication

Most endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token is obtained from `/api/auth/register` or `/api/auth/login` endpoints and should be included in all authenticated requests.
