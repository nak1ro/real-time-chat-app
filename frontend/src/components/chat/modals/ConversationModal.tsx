'use client';

import type { Conversation } from '@/types/conversation.types';
import type { Attachment } from '@/types/message.types';
import type { UserWithStatus } from '@/types/user.types';
import { ConversationType, MemberRole } from '@/types/enums';
import { DirectMessageModal } from './DirectMessageModal';
import { GroupModal } from './GroupModal';
import { ChannelModal } from './ChannelModal';

interface ConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  currentUserId: string;
  images?: Attachment[];
  files?: Attachment[];
  availableUsers?: UserWithStatus[];
  isLoading?: boolean;
  getUserStatus?: (userId: string) => UserWithStatus | undefined;
  
  // Role-based permissions (from useConversationRole hook)
  role?: MemberRole | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  isElevated?: boolean;
  isMember?: boolean;
  isRoleLoading?: boolean;
  
  // DM-specific callbacks
  onStartMessaging?: () => void;
  onDeleteChat?: () => void;
  onBlockUser?: () => void;
  
  // Group-specific callbacks
  onLeaveGroup?: () => void;
  onKickMember?: (userId: string) => void;
  onInviteUsers?: (userIds: string[]) => void;
  
  // Channel-specific callbacks
  onLeaveChannel?: () => void;
  onDeleteChannel?: () => void;
  onRemoveSubscriber?: (userId: string) => void;
  
  // Common callbacks
  onUpdateSettings?: (data: { name?: string; description?: string; avatarUrl?: string }) => void;
  onUpdateRoles?: (updates: { userId: string; role: MemberRole }[]) => void;
}

export function ConversationModal({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  images = [],
  files = [],
  availableUsers = [],
  isLoading = false,
  getUserStatus,
  // Role-based permissions
  role,
  isOwner = false,
  isAdmin = false,
  isElevated = false,
  isMember = true,
  isRoleLoading = false,
  // Callbacks
  onStartMessaging,
  onDeleteChat,
  onBlockUser,
  onLeaveGroup,
  onKickMember,
  onInviteUsers,
  onLeaveChannel,
  onDeleteChannel,
  onRemoveSubscriber,
  onUpdateSettings,
  onUpdateRoles,
}: ConversationModalProps) {
  // Find the other user for DM conversations
  const otherMember = conversation.type === ConversationType.DIRECT
    ? conversation.members?.find(m => m.userId !== currentUserId)
    : undefined;

  const otherUserStatus = otherMember 
    ? getUserStatus?.(otherMember.userId) 
    : undefined;

  // Render the appropriate modal based on conversation type
  switch (conversation.type) {
    case ConversationType.DIRECT:
      if (!otherMember) {
        return null;
      }
      return (
        <DirectMessageModal
          open={open}
          onOpenChange={onOpenChange}
          conversation={conversation}
          currentUserId={currentUserId}
          otherUser={otherUserStatus || {
            id: otherMember.userId,
            name: otherMember.user.name,
            avatarUrl: otherMember.user.avatarUrl,
            status: null,
            lastSeenAt: null,
          }}
          images={images}
          files={files}
          isLoading={isLoading}
          onStartMessaging={onStartMessaging}
          onDeleteChat={onDeleteChat}
          onBlockUser={onBlockUser}
        />
      );

    case ConversationType.GROUP:
      return (
        <GroupModal
          open={open}
          onOpenChange={onOpenChange}
          conversation={conversation}
          currentUserId={currentUserId}
          images={images}
          files={files}
          availableUsers={availableUsers}
          isLoading={isLoading}
          isElevated={isElevated}
          isOwner={isOwner}
          isRoleLoading={isRoleLoading}
          currentUserRole={role}
          getUserStatus={getUserStatus}
          onLeaveGroup={onLeaveGroup}
          onKickMember={onKickMember}
          onInviteUsers={onInviteUsers}
          onUpdateSettings={onUpdateSettings}
          onUpdateRoles={onUpdateRoles}
        />
      );

    case ConversationType.CHANNEL:
      return (
        <ChannelModal
          open={open}
          onOpenChange={onOpenChange}
          conversation={conversation}
          currentUserId={currentUserId}
          images={images}
          files={files}
          isLoading={isLoading}
          isElevated={isElevated}
          isOwner={isOwner}
          isRoleLoading={isRoleLoading}
          currentUserRole={role}
          getUserStatus={getUserStatus}
          onLeaveChannel={onLeaveChannel}
          onDeleteChannel={onDeleteChannel}
          onRemoveSubscriber={onRemoveSubscriber}
          onUpdateSettings={onUpdateSettings}
          onUpdateRoles={onUpdateRoles}
        />
      );

    default:
      return null;
  }
}

