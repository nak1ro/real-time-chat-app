'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  ChatListPanel,
  ChatDetailPanel,
  EmptyChatState,
  ChannelPreview,
  ChatHeader,
  ConversationModal,
} from '@/components/chat';
import { cn } from '@/lib/utils';
import {
  useAuth,
  useConversations,
  useConversationRole,
  useConversationAttachments,
  useUpdateConversation,
  useLeaveConversation,
  useDeleteConversation,
  useMessages,
  useCreateMessage,
  useEditMessage,
  useDeleteMessage,
  useUploadAttachment,
  useMessageSocketListeners,
  useSocket,
} from '@/hooks';
import { conversationApi } from '@/lib/api';
import type { Conversation, Message, AttachmentData, UploadedAttachment, Attachment } from '@/types';
import { AttachmentType } from '@/types/enums';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Socket connection status indicator component
function ConnectionIndicator({ status, isConnected }: { status: string; isConnected: boolean }) {
  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-md text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-xs">
        <Wifi className="h-3 w-3" />
        <span>Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-xs">
      <WifiOff className="h-3 w-3" />
      <span>Disconnected</span>
    </div>
  );
}

export default function ChatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { socket, status, isConnected, joinConversation, leaveConversation } = useSocket();

  // Get conversationId from route params (/chats/[conversationId]) or query params (?conversation=...)
  const urlConversationId = (params?.conversationId as string) || searchParams?.get('conversation');

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(urlConversationId || null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Conversation details modal state (defined early for use in hooks)
  const [showConversationModal, setShowConversationModal] = useState(false);

  // Track the previous conversation to leave when switching
  const previousConversationIdRef = useRef<string | null>(null);

  // Fetch conversations
  const { data: conversations = [] } = useConversations();

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: isLoadingMessages } = useMessages(
    selectedConversationId || undefined
  );

  // Get current user's role in the selected conversation
  const {
    role: currentUserRole,
    isOwner,
    isAdmin,
    isElevated,
    isMember,
    isLoading: isRoleLoading,
  } = useConversationRole(selectedConversationId || undefined);

  // Fetch attachments for selected conversation (only when modal is open)
  const {
    data: attachmentsData,
    isLoading: isLoadingAttachments,
    isError: isAttachmentsError,
    refetch: refetchAttachments,
  } = useConversationAttachments(
    showConversationModal ? (selectedConversationId || '') : ''
  );

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
      console.log('[ChatsPage] Conversation updated:', conversation.id);
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      console.error('[ChatsPage] Failed to update conversation:', error.message);
      toast.error('Failed to update settings');
    },
  });

  // Leave conversation mutation
  const leaveConversationMutation = useLeaveConversation({
    onSuccess: () => {
      console.log('[ChatsPage] Left conversation successfully');
      toast.success('Left conversation successfully');
      setShowConversationModal(false);
      setSelectedConversationId(null);
      setMobileView('list');
    },
    onError: (error) => {
      console.error('[ChatsPage] Failed to leave conversation:', error.message);
      toast.error('Failed to leave conversation');
    },
  });

  // Delete conversation mutation
  const deleteConversation = useDeleteConversation({
    onSuccess: () => {
      console.log('[ChatsPage] Deleted conversation successfully');
      toast.success('Chat deleted successfully');
      setShowConversationModal(false);
      setSelectedConversationId(null);
      setMobileView('list');
    },
    onError: (error) => {
      console.error('[ChatsPage] Failed to delete conversation:', error.message);
      toast.error('Failed to delete chat');
    },
  });

  // Create message mutation
  const createMessage = useCreateMessage({
    onSuccess: (message) => {
      console.log('[ChatsPage] Message created successfully:', message.id);
    },
    onError: (error) => {
      console.error('[ChatsPage] Failed to create message:', error.message);
    },
  });

  // Edit message mutation
  const editMessage = useEditMessage({
    onSuccess: (message) => {
      console.log('[ChatsPage] Message edited successfully:', message.id);
    },
    onError: (error) => {
      console.error('[ChatsPage] Failed to edit message:', error.message);
    },
  });

  // Delete message mutation
  const deleteMessage = useDeleteMessage({
    onSuccess: (message) => {
      console.log('[ChatsPage] Message deleted successfully:', message.id);
    },
    onError: (error) => {
      console.error('[ChatsPage] Failed to delete message:', error.message);
    },
  });

  // Upload attachment mutation
  const uploadAttachment = useUploadAttachment({
    onSuccess: (response) => {
      console.log('[ChatsPage] Attachment uploaded successfully:', response.attachment.fileName);
    },
    onError: (error) => {
      console.error('[ChatsPage] Failed to upload attachment:', error.message);
    },
  });

  // Get selected conversation
  const selectedConversation = useMemo<Conversation | null>(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  // Get messages for selected conversation
  const messages = useMemo<Message[]>(
    () => messagesData?.messages || [],
    [messagesData]
  );

  // Debug: Log socket status changes
  useEffect(() => {
    console.log('[ChatsPage] Socket status changed:', { status, isConnected, hasSocket: !!socket });
  }, [status, isConnected, socket]);

  // Sync URL parameter with state
  useEffect(() => {
    if (urlConversationId && urlConversationId !== selectedConversationId) {
      console.log('[ChatsPage] URL conversation changed, updating state:', urlConversationId);
      setSelectedConversationId(urlConversationId);
      setMobileView('detail'); // Show detail view when navigating via URL
    }
  }, [urlConversationId, selectedConversationId]);

  // Join/leave conversation rooms when selection changes
  useEffect(() => {
    const handleConversationChange = async () => {
      // Leave previous conversation if any
      if (previousConversationIdRef.current && previousConversationIdRef.current !== selectedConversationId) {
        console.log('[ChatsPage] Leaving previous conversation:', previousConversationIdRef.current);
        await leaveConversation(previousConversationIdRef.current);
      }

      // Join new conversation if selected and socket is connected
      if (selectedConversationId && isConnected) {
        console.log('[ChatsPage] Joining conversation:', selectedConversationId);
        const joined = await joinConversation(selectedConversationId);
        if (joined) {
          console.log('[ChatsPage] Successfully joined conversation room:', selectedConversationId);
        } else {
          console.warn('[ChatsPage] Failed to join conversation room:', selectedConversationId);
        }
      }

      // Update the ref
      previousConversationIdRef.current = selectedConversationId;
    };

    handleConversationChange();
  }, [selectedConversationId, isConnected, joinConversation, leaveConversation]);

  // Cleanup: leave conversation on unmount
  useEffect(() => {
    return () => {
      if (previousConversationIdRef.current) {
        console.log('[ChatsPage] Cleanup: leaving conversation:', previousConversationIdRef.current);
        leaveConversation(previousConversationIdRef.current);
      }
    };
  }, [leaveConversation]);

  // Real-time message socket listeners
  useMessageSocketListeners({
    conversationId: selectedConversationId || undefined,
    onNewMessage: useCallback((message: Message) => {
      console.log('[ChatsPage] New message received via socket:', message.id);
    }, []),
    onMessageUpdated: useCallback((message: Message) => {
      console.log('[ChatsPage] Message updated via socket:', message.id);
    }, []),
    onMessageDeleted: useCallback((message: Message) => {
      console.log('[ChatsPage] Message deleted via socket:', message.id);
    }, []),
  });

  // Channel preview state
  const [previewConversation, setPreviewConversation] = useState<Conversation | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    console.log('[ChatsPage] Selecting conversation:', conversationId);
    // Navigate to the conversation URL (enables deep-linking and browser history)
    router.push(`/chats/${conversationId}`);
    setPreviewConversation(null); // Clear preview when selecting a chat
  }, [router]);

  // Handle preview request from global search
  const handlePreviewConversation = useCallback((conversation: Conversation) => {
    console.log('[ChatsPage] Previewing conversation:', conversation.id);
    setPreviewConversation(conversation);
    setSelectedConversationId(null); // Clear selection when previewing
    setMobileView('detail');
  }, []);

  // Handle join channel
  const handleJoinChannel = useCallback(async () => {
    if (!previewConversation || !previewConversation.slug) return;

    setIsJoining(true);
    try {
      console.log('[ChatsPage] Joining channel:', previewConversation.slug);
      const joined = await conversationApi.joinBySlug(previewConversation.slug);

      // Refresh conversations list
      // Note: In a real app we might want to optimistically update or invalidate queries
      // But for now we'll rely on the navigation to trigger updates or socket events

      // Select the joined conversation
      handleSelectConversation(joined.id);
    } catch (error) {
      console.error('[ChatsPage] Failed to join channel:', error);
      // TODO: Show error toast
    } finally {
      setIsJoining(false);
    }
  }, [previewConversation, handleSelectConversation]);

  // Handle cancel preview
  const handleCancelPreview = useCallback(() => {
    setPreviewConversation(null);
    setMobileView('list');
  }, []);

  // Handle back navigation (mobile)
  const handleBack = useCallback(() => {
    router.push('/chats'); // Navigate back to chat list
    setPreviewConversation(null);
  }, [router]);

  // Handle send message
  const handleSendMessage = useCallback((text: string, replyToId?: string, attachments?: AttachmentData[]) => {
    if (!selectedConversationId) return;

    // Allow sending if there's text OR attachments
    const hasContent = text.trim() || (attachments && attachments.length > 0);
    if (!hasContent) return;

    console.log('[ChatsPage] Sending message to conversation:', selectedConversationId, {
      textLength: text.trim().length,
      attachmentsCount: attachments?.length ?? 0,
    });

    createMessage.mutate({
      conversationId: selectedConversationId,
      text: text.trim(),
      replyToId,
      attachments,
    });
  }, [selectedConversationId, createMessage]);

  // Handle upload attachment
  const handleUploadAttachment = useCallback(async (file: File): Promise<UploadedAttachment | null> => {
    try {
      const response = await uploadAttachment.mutateAsync(file);
      return response.attachment;
    } catch (error) {
      console.error('[ChatsPage] Failed to upload attachment:', error);
      return null;
    }
  }, [uploadAttachment]);

  // Handle edit message
  const handleEditMessage = useCallback((messageId: string, text: string) => {
    if (!text.trim()) return;

    console.log('[ChatsPage] Editing message:', messageId);

    editMessage.mutate({
      id: messageId,
      data: { text: text.trim() },
    });
  }, [editMessage]);

  // Handle delete message
  const handleDeleteMessage = useCallback((messageId: string) => {
    console.log('[ChatsPage] Deleting message:', messageId);

    deleteMessage.mutate(messageId);
  }, [deleteMessage]);

  // Handle open conversation details modal
  const handleOpenConversationDetails = useCallback(() => {
    if (selectedConversation) {
      console.log('[ChatsPage] Opening conversation details:', selectedConversation.id);
      setShowConversationModal(true);
    }
  }, [selectedConversation]);

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col">
      {/* Debug: Socket connection indicator */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-xs text-muted-foreground">
          {previewConversation
            ? `Preview: ${previewConversation.name}`
            : selectedConversation
              ? `Chat: ${selectedConversation.name || 'Direct Message'}`
              : 'Select a chat'}
        </span>
        <ConnectionIndicator status={status} isConnected={isConnected} />
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Chat List Panel */}
        <div
          className={cn(
            'w-full md:w-[340px] lg:w-[360px] border-r border-border bg-background flex-shrink-0 overflow-hidden',
            mobileView === 'detail' ? 'hidden md:flex md:flex-col' : 'flex flex-col'
          )}
        >
          <ChatListPanel
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onPreviewConversation={handlePreviewConversation}
          />
        </div>

        {/* Chat Detail Panel or Preview */}
        <div
          className={cn(
            'flex-1 bg-background min-w-0 overflow-hidden',
            mobileView === 'list' ? 'hidden md:flex md:flex-col' : 'flex flex-col'
          )}
        >
          {previewConversation ? (
            <div className="h-full flex flex-col">
              {/* Header for mobile back button */}
              <div className="md:hidden flex-shrink-0">
                <ChatHeader
                  conversation={previewConversation}
                  isOnline={false}
                  onBack={handleBack}
                  showBackButton={true}
                />
              </div>
              <div className="flex-1">
                <ChannelPreview
                  channel={previewConversation}
                  onJoin={handleJoinChannel}
                  onCancel={handleCancelPreview}
                  isJoining={isJoining}
                />
              </div>
            </div>
          ) : selectedConversation && user ? (
            <ChatDetailPanel
              key={selectedConversation.id}
              conversation={selectedConversation}
              messages={messages}
              currentUserId={user.id}
              onBack={handleBack}
              showBackButton={mobileView === 'detail'}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              isSending={createMessage.isPending}
              onUploadAttachment={handleUploadAttachment}
              isUploading={uploadAttachment.isPending}
              onOpenDetails={handleOpenConversationDetails}
            />
          ) : (
            <EmptyChatState />
          )}
        </div>
      </div>

      {/* Conversation Details Modal */}
      {selectedConversation && user && (
        <ConversationModal
          open={showConversationModal}
          onOpenChange={setShowConversationModal}
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
          onStartMessaging={() => setShowConversationModal(false)}
          onDeleteChat={() => {
            console.log('[ChatsPage] Deleting DM conversation:', selectedConversation.id);
            deleteConversation.mutate(selectedConversation.id);
          }}
          onBlockUser={() => {
            console.log('[ChatsPage] Block user requested');
            toast.info('Block user functionality coming soon');
            // TODO: Implement block user
          }}
          onLeaveGroup={() => {
            console.log('[ChatsPage] Leaving group:', selectedConversation.id);
            leaveConversationMutation.mutate(selectedConversation.id);
          }}
          onLeaveChannel={() => {
            console.log('[ChatsPage] Leaving channel:', selectedConversation.id);
            leaveConversationMutation.mutate(selectedConversation.id);
          }}
          onDeleteChannel={() => {
            console.log('[ChatsPage] Deleting channel:', selectedConversation.id);
            deleteConversation.mutate(selectedConversation.id);
          }}
          onKickMember={(userId) => {
            console.log('[ChatsPage] Kick member requested:', userId);
            toast.info('Kick member functionality coming soon');
            // TODO: Implement kick member via useRemoveMember hook
          }}
          onInviteUsers={async (userIds) => {
            console.log('[ChatsPage] Invite users requested:', userIds);
            if (!selectedConversation) return;

            try {
              const { invitationApi } = await import('@/lib/api');
              const result = await invitationApi.create(selectedConversation.id, userIds);

              toast.success('Invitations sent', {
                description: `Sent ${result.count} invitation${result.count !== 1 ? 's' : ''}`,
              });

              // Close the modal
              setShowConversationModal(false);
            } catch (error) {
              console.error('[ChatsPage] Failed to send invitations:', error);
              toast.error('Failed to send invitations', {
                description: error instanceof Error ? error.message : 'Please try again',
              });
            }
          }}
          onRemoveSubscriber={(userId) => {
            console.log('[ChatsPage] Remove subscriber requested:', userId);
            toast.info('Remove subscriber functionality coming soon');
            // TODO: Implement remove subscriber via useRemoveMember hook
          }}
          onUpdateSettings={(data) => {
            console.log('[ChatsPage] Updating settings:', data);
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
            console.log('[ChatsPage] Update roles requested:', updates);
            toast.info('Update roles functionality coming soon');
            // TODO: Implement update roles via useUpdateMemberRole hook
          }}
        />
      )}
    </div>
  );
}

