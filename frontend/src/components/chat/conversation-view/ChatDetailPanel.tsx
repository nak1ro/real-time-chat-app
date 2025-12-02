'use client';

import { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from '../messages/MessageList';
import { MessageInput } from '../messages/MessageInput';
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
}: ChatDetailPanelProps) {
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
    setEditingMessage(null); // Cancel edit if replying
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setReplyToMessage(null); // Cancel reply if editing
  };

  const handleDelete = (messageId: string) => {
    onDeleteMessage?.(messageId);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

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
        />
      </div>

      {/* Message list - scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          conversationId={conversation.id}
          isLoading={isLoadingMessages}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
