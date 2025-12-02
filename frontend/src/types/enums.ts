// Enums matching backend Prisma schema

export enum Status {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL',
}

export enum MemberRole {
  MEMBER = 'MEMBER',
  MODERATOR = 'ADMIN',
  ADMIN = 'OWNER',
}

export enum AttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

export enum MessageDeliveryStatus {
  SENT = 'SENT',
  READ = 'READ',
}

// UI notification types (extended from backend for richer notifications)
export enum NotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  MENTION = 'MENTION',
  REACTION = 'REACTION',
  REPLY = 'REPLY',
  CONVERSATION_INVITE = 'CONVERSATION_INVITE',
  ROLE_CHANGE = 'ROLE_CHANGE',
}
