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
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
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
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export enum ModerationActionType {
  KICK = 'KICK',
  BAN = 'BAN',
  UNBAN = 'UNBAN',
  MUTE = 'MUTE',
  UNMUTE = 'UNMUTE',
  MAKE_ADMIN = 'MAKE_ADMIN',
  REMOVE_ADMIN = 'REMOVE_ADMIN',
  DELETE_MESSAGE = 'DELETE_MESSAGE',
  PIN_MESSAGE = 'PIN_MESSAGE',
}

export enum NotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  MENTION = 'MENTION',
  REACTION = 'REACTION',
  REPLY = 'REPLY',
  CONVERSATION_INVITE = 'CONVERSATION_INVITE',
  ROLE_CHANGE = 'ROLE_CHANGE',
}

