'use client';

import type { Conversation } from '@/types/conversation.types';
import type { Attachment } from '@/types/message.types';
import type { UserWithStatus } from '@/types/user.types';
import { ConversationType, MemberRole } from '@/types/enums';
import { DirectMessageModal } from './DirectMessageModal';
import { GroupModal } from './GroupModal';
import { ChannelModal } from './ChannelModal';
import { conversationApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ConversationMember } from '@/types/conversation.types';
import { useRemoveMember, useUpdateMemberRole } from '@/hooks';

interface ConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  currentUserId: string;
  images?: Attachment[];
  files?: Attachment[];
  isLoading?: boolean;
  isError?: boolean;
  getUserStatus?: (userId: string) => UserWithStatus | undefined;

  // Role-based permissions (from useConversationRole hook)
  role?: MemberRole | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  isElevated?: boolean;
  isMember?: boolean;
  isRoleLoading?: boolean;

  // Loading states for actions
  isDeleting?: boolean;
  isLeaving?: boolean;
  isSavingSettings?: boolean;

  // Retry callback
  onRetryAttachments?: () => void;

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
  isLoading = false,
  isError = false,
  getUserStatus,
  // Role-based permissions
  role,
  isOwner = false,
  isAdmin = false,
  isElevated = false,
  isMember = true,
  isRoleLoading = false,
  // Loading states
  isDeleting = false,
  isLeaving = false,
  isSavingSettings = false,
  // Retry
  onRetryAttachments,
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
  const router = useRouter();
  const removeMember = useRemoveMember();
  const updateMemberRole = useUpdateMemberRole();

  const handleMemberClick = async (member: ConversationMember) => {
    if (member.userId === currentUserId) {
      return;
    }

    try {
      onOpenChange(false);
      const conversation = await conversationApi.createDirect({ otherUserId: member.userId });
      router.push(`/chats/${conversation.id}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleKickMember = (memberId: string) => {
    removeMember.mutate({ id: conversation.id, memberId }, {
      onSuccess: () => {
        toast.success('Member removed successfully');
      },
      onError: (error) => {
        toast.error('Failed to remove member');
        console.error('Failed to remove member:', error);
      }
    });
  };

  const handleUpdateRoles = (updates: { userId: string; role: MemberRole }[]) => {
    // Process updates sequentially
    updates.forEach(({ userId, role }) => {
      updateMemberRole.mutate({ id: conversation.id, memberId: userId, role }, {
        onSuccess: () => {
          toast.success('Role updated successfully');
        },
        onError: (error) => {
          toast.error('Failed to update role');
          console.error('Failed to update role:', error);
        }
      });
    });
  };

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
          isError={isError}
          isDeleting={isDeleting}
          onRetryAttachments={onRetryAttachments}
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
          isLoading={isLoading}
          isError={isError}
          isLeaving={isLeaving}
          isSavingSettings={isSavingSettings}
          isElevated={isElevated}
          isOwner={isOwner}
          isRoleLoading={isRoleLoading}
          currentUserRole={role}
          getUserStatus={getUserStatus}
          onRetryAttachments={onRetryAttachments}
          onLeaveGroup={onLeaveGroup}
          onKickMember={handleKickMember}
          onInviteUsers={onInviteUsers}
          onUpdateSettings={onUpdateSettings}
          onUpdateRoles={handleUpdateRoles}
          onMemberClick={handleMemberClick}
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
          isError={isError}
          isLeaving={isLeaving}
          isDeleting={isDeleting}
          isSavingSettings={isSavingSettings}
          isElevated={isElevated}
          isOwner={isOwner}
          isRoleLoading={isRoleLoading}
          currentUserRole={role}
          getUserStatus={getUserStatus}
          onRetryAttachments={onRetryAttachments}
          onLeaveChannel={onLeaveChannel}
          onDeleteChannel={onDeleteChannel}
          onRemoveSubscriber={handleKickMember}
          onUpdateSettings={onUpdateSettings}
          onUpdateRoles={handleUpdateRoles}
          onMemberClick={handleMemberClick}
        />
      );

    default:
      return null;
  }
}

