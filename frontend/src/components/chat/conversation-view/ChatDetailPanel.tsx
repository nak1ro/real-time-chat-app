'use client';

import { useState, useMemo } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList, MessageInput } from '@/components/chat';
import type { Conversation, Message, AttachmentData, UploadedAttachment } from '@/types';

interface ChatDetailPanelProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  isLoadingMessages?: boolean;
  isOnline?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  onSendMessage: (text: string, replyToId?: string, attachments?: AttachmentData[]) => void;
  onEditMessage?: (messageId: string, text: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isSending?: boolean;
  onUploadAttachment?: (file: File) => Promise<UploadedAttachment | null>;
  isUploading?: boolean;
  onOpenDetails?: () => void;
  onAvatarClick?: (userId: string) => void;
}

export function ChatDetailPanel({
  conversation,
  messages,
  currentUserId,
  isLoadingMessages = false,
  isOnline = false,
  onBack,
  showBackButton = false,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  isSending = false,
  onUploadAttachment,
  isUploading = false,
  onOpenDetails,
  onAvatarClick,
}: ChatDetailPanelProps) {
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) {
      return messages;
    }

    const query = searchQuery.toLowerCase().trim();
    return messages.filter((message) => {
      // Don't filter out deleted messages if they match
      const text = message.isDeleted ? '[deleted message]' : message.text;
      return text.toLowerCase().includes(query);
    });
  }, [messages, searchQuery]);

  // Function to set message for reply
  const handleReply = (message: Message) => {
    setReplyToMessage(message);
    setEditingMessage(null); // Cancel edit if replying
  };

  // Function to set message for editing
  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setReplyToMessage(null); // Cancel reply if editing
  };

  // Function to handle message deletion
  const handleDelete = (messageId: string) => {
    onDeleteMessage?.(messageId);
  };

  // Function to clear the reply state
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  // Function to clear the edit state
  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  // Function to handle save for edited message
  const handleEditSave = (messageId: string, text: string) => {
    onEditMessage?.(messageId, text);
    setEditingMessage(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - fixed at top */}
      <div className="flex-shrink-0">
        <ChatHeader
          conversation={conversation}
          isOnline={isOnline}
          onBack={onBack}
          showBackButton={showBackButton}
          onOpenDetails={onOpenDetails}
          currentUserId={currentUserId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Message list - scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList
          messages={filteredMessages}
          currentUserId={currentUserId}
          conversationId={conversation.id}
          isLoading={isLoadingMessages}
          searchQuery={searchQuery}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAvatarClick={onAvatarClick}
        />
      </div>

      {/* Input - fixed at bottom */}
      <div className="flex-shrink-0">
        <MessageInput
          onSend={onSendMessage}
          disabled={isSending}
          replyToMessage={replyToMessage}
          onCancelReply={handleCancelReply}
          editingMessage={editingMessage}
          onCancelEdit={handleCancelEdit}
          onEditSave={handleEditSave}
          onUploadAttachment={onUploadAttachment}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
}