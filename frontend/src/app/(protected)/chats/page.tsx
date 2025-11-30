'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  useMessages,
  useCreateMessage,
  useEditMessage,
  useDeleteMessage,
  useUploadAttachment,
  useMessageSocketListeners,
  useSocket,
} from '@/hooks';
import { conversationApi } from '@/lib/api';
import type { Conversation, Message, AttachmentData, UploadedAttachment } from '@/types';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

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
  const { socket, status, isConnected, joinConversation, leaveConversation } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Track the previous conversation to leave when switching
  const previousConversationIdRef = useRef<string | null>(null);

  // Fetch conversations
  const { data: conversations = [] } = useConversations();

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: isLoadingMessages } = useMessages(
    selectedConversationId || undefined
  );

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

  // Conversation details modal state
  const [showConversationModal, setShowConversationModal] = useState(false);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    console.log('[ChatsPage] Selecting conversation:', conversationId);
    setSelectedConversationId(conversationId);
    setPreviewConversation(null); // Clear preview when selecting a chat
    setMobileView('detail');
  }, []);

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
    setMobileView('list');
    setPreviewConversation(null);
  }, []);

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
          onStartMessaging={() => setShowConversationModal(false)}
          onDeleteChat={() => {
            console.log('[ChatsPage] Delete chat requested');
            // TODO: Implement delete chat
          }}
          onBlockUser={() => {
            console.log('[ChatsPage] Block user requested');
            // TODO: Implement block user
          }}
          onLeaveGroup={() => {
            console.log('[ChatsPage] Leave group requested');
            // TODO: Implement leave group
          }}
          onLeaveChannel={() => {
            console.log('[ChatsPage] Leave channel requested');
            // TODO: Implement leave channel
          }}
          onDeleteChannel={() => {
            console.log('[ChatsPage] Delete channel requested');
            // TODO: Implement delete channel
          }}
          onKickMember={(userId) => {
            console.log('[ChatsPage] Kick member requested:', userId);
            // TODO: Implement kick member
          }}
          onInviteUsers={(userIds) => {
            console.log('[ChatsPage] Invite users requested:', userIds);
            // TODO: Implement invite users
          }}
          onRemoveSubscriber={(userId) => {
            console.log('[ChatsPage] Remove subscriber requested:', userId);
            // TODO: Implement remove subscriber
          }}
          onUpdateSettings={(data) => {
            console.log('[ChatsPage] Update settings requested:', data);
            // TODO: Implement update settings
          }}
          onUpdateRoles={(updates) => {
            console.log('[ChatsPage] Update roles requested:', updates);
            // TODO: Implement update roles
          }}
        />
      )}
    </div>
  );
}

