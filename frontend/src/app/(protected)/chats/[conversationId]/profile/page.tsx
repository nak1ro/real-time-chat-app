'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
    ConversationModal,
} from '@/components/chat';
import {
    useAuth,
    useConversations,
    useConversationRole,
    useConversationAttachments,
    useUpdateConversation,
    useLeaveConversation,
    useDeleteConversation,
} from '@/hooks';
import type { Attachment } from '@/types';
import { AttachmentType } from '@/types/enums';
import { toast } from 'sonner';
import { useMemo } from 'react';

export default function ConversationProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const conversationId = params?.conversationId as string;

    // Fetch conversations to get the selected one
    const { data: conversations = [] } = useConversations();
    const selectedConversation = useMemo(
        () => conversations.find((c) => c.id === conversationId) || null,
        [conversations, conversationId]
    );

    // Get current user's role in the selected conversation
    const {
        role: currentUserRole,
        isOwner,
        isAdmin,
        isElevated,
        isMember,
        isLoading: isRoleLoading,
    } = useConversationRole(conversationId || undefined);

    // Fetch attachments for selected conversation
    const {
        data: attachmentsData,
        isLoading: isLoadingAttachments,
        isError: isAttachmentsError,
        refetch: refetchAttachments,
    } = useConversationAttachments(conversationId || '');

    // Flatten attachments from paginated data and categorize
    const { images, files } = useMemo(() => {
        const allAttachments: Attachment[] = attachmentsData?.pages?.flatMap(page => page.attachments) || [];
        const images = allAttachments.filter(a => a.type === AttachmentType.IMAGE);
        const files = allAttachments.filter(a => a.type !== AttachmentType.IMAGE);
        return { images, files };
    }, [attachmentsData]);

    // Update conversation mutation
    const updateConversation = useUpdateConversation({
        onSuccess: (conversation) => {
            console.log('[ConversationProfilePage] Conversation updated:', conversation.id);
            toast.success('Settings updated successfully');
        },
        onError: (error) => {
            console.error('[ConversationProfilePage] Failed to update conversation:', error.message);
            toast.error('Failed to update settings');
        },
    });

    // Leave conversation mutation
    const leaveConversationMutation = useLeaveConversation({
        onSuccess: () => {
            console.log('[ConversationProfilePage] Left conversation successfully');
            toast.success('Left conversation successfully');
            router.push('/chats');
        },
        onError: (error) => {
            console.error('[ConversationProfilePage] Failed to leave conversation:', error.message);
            toast.error('Failed to leave conversation');
        },
    });

    // Delete conversation mutation
    const deleteConversation = useDeleteConversation({
        onSuccess: () => {
            console.log('[ConversationProfilePage] Deleted conversation successfully');
            toast.success('Chat deleted successfully');
            router.push('/chats');
        },
        onError: (error) => {
            console.error('[ConversationProfilePage] Failed to delete conversation:', error.message);
            toast.error('Failed to delete chat');
        },
    });

    // Handle close modal - navigate back to the chat
    const handleClose = () => {
        router.back();
    };

    // If no conversation found, redirect back
    useEffect(() => {
        if (!conversationId) {
            router.push('/chats');
        }
    }, [conversationId, router]);

    if (!selectedConversation || !user) {
        return null;
    }

    return (
        <ConversationModal
            open={true}
            onOpenChange={(open) => {
                if (!open) {
                    handleClose();
                }
            }}
            conversation={selectedConversation}
            currentUserId={user.id}
            // Attachments
            images={images}
            files={files}
            isLoading={isLoadingAttachments}
            isError={isAttachmentsError}
            onRetryAttachments={() => refetchAttachments()}
            // Role-based permissions from useConversationRole hook
            role={currentUserRole}
            isOwner={isOwner}
            isAdmin={isAdmin}
            isElevated={isElevated}
            isMember={isMember}
            isRoleLoading={isRoleLoading}
            // Loading states
            isDeleting={deleteConversation.isPending}
            isLeaving={leaveConversationMutation.isPending}
            isSavingSettings={updateConversation.isPending}
            // Callbacks
            onStartMessaging={() => handleClose()}
            onDeleteChat={() => {
                console.log('[ConversationProfilePage] Deleting DM conversation:', selectedConversation.id);
                deleteConversation.mutate(selectedConversation.id);
            }}
            onBlockUser={() => {
                console.log('[ConversationProfilePage] Block user requested');
                toast.info('Block user functionality coming soon');
                // TODO: Implement block user
            }}
            onLeaveGroup={() => {
                console.log('[ConversationProfilePage] Leaving group:', selectedConversation.id);
                leaveConversationMutation.mutate(selectedConversation.id);
            }}
            onLeaveChannel={() => {
                console.log('[ConversationProfilePage] Leaving channel:', selectedConversation.id);
                leaveConversationMutation.mutate(selectedConversation.id);
            }}
            onDeleteChannel={() => {
                console.log('[ConversationProfilePage] Deleting channel:', selectedConversation.id);
                deleteConversation.mutate(selectedConversation.id);
            }}
            onKickMember={(userId) => {
                console.log('[ConversationProfilePage] Kick member requested:', userId);
                toast.info('Kick member functionality coming soon');
                // TODO: Implement kick member via useRemoveMember hook
            }}
            onInviteUsers={async (userIds) => {
                console.log('[ConversationProfilePage] Invite users requested:', userIds);
                if (!selectedConversation) return;

                try {
                    const { invitationApi } = await import('@/lib/api');
                    const result = await invitationApi.create(selectedConversation.id, userIds);

                    toast.success('Invitations sent', {
                        description: `Sent ${result.count} invitation${result.count !== 1 ? 's' : ''}`,
                    });
                } catch (error) {
                    console.error('[ConversationProfilePage] Failed to send invitations:', error);
                    toast.error('Failed to send invitations', {
                        description: error instanceof Error ? error.message : 'Please try again',
                    });
                }
            }}
            onRemoveSubscriber={(userId) => {
                console.log('[ConversationProfilePage] Remove subscriber requested:', userId);
                toast.info('Remove subscriber functionality coming soon');
                // TODO: Implement remove subscriber via useRemoveMember hook
            }}
            onUpdateSettings={(data) => {
                console.log('[ConversationProfilePage] Updating settings:', data);
                updateConversation.mutate({
                    id: selectedConversation.id,
                    data: {
                        name: data.name,
                        description: data.description,
                        avatarUrl: data.avatarUrl,
                    },
                });
            }}
            onUpdateRoles={(updates) => {
                console.log('[ConversationProfilePage] Update roles requested:', updates);
                toast.info('Update roles functionality coming soon');
                // TODO: Implement update roles via useUpdateMemberRole hook
            }}
        />
    );
}
