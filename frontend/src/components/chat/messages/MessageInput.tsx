'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Textarea } from '@/components/ui';
import { Send, X, Paperclip, Loader2 } from 'lucide-react';
import type { Message, UploadedAttachment, AttachmentData } from '@/types';
import { AttachmentType } from '@/types';
import { AttachmentPreview } from '../attachments/AttachmentPreview';

interface MessageInputProps {
  onSend: (content: string, replyToId?: string, attachments?: AttachmentData[]) => void;
  disabled?: boolean;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  onEditSave?: (messageId: string, text: string) => void;
  onUploadAttachment?: (file: File) => Promise<UploadedAttachment | null>;
  isUploading?: boolean;
}

// Convert UploadedAttachment to AttachmentData format
function convertAttachmentsToData(attachments: UploadedAttachment[]): AttachmentData[] {
  return attachments.map((att) => ({
    url: att.url,
    thumbnailUrl: att.thumbnailUrl ?? undefined,
    fileName: att.fileName,
    mimeType: att.mimeType,
    sizeBytes: att.sizeBytes,
    type: att.type as AttachmentType,
    width: att.width ?? undefined,
    height: att.height ?? undefined,
    durationMs: att.durationMs ?? undefined,
  }));
}

// Reply preview banner
function ReplyPreview({
  message,
  onCancel,
}: {
  message: Message;
  onCancel: () => void;
}) {
  const displayText = message.isDeleted ? 'This message was deleted' : message.text;
  const senderName = message.user?.name || 'Unknown';

  return (
    <div className="px-3 pt-3 pb-1">
      <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-2 border-l-2 border-primary">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary">
            Replying to {senderName}
          </p>
          <p
            className={`text-xs text-muted-foreground truncate ${
              message.isDeleted ? 'italic' : ''
            }`}
          >
            {displayText}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Edit preview banner
function EditPreview({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="px-3 pt-3 pb-1">
      <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-2 border-l-2 border-blue-500">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-blue-500">
            Editing message
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function MessageInput({
  onSend,
  disabled = false,
  replyToMessage,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onEditSave,
  onUploadAttachment,
  isUploading = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<UploadedAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldRefocusRef = useRef(false);

  // Set message text when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.text);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Refocus textarea after sending
  useEffect(() => {
    if (!disabled && shouldRefocusRef.current) {
      shouldRefocusRef.current = false;
      textareaRef.current?.focus();
    }
  }, [disabled]);

  // Handle file selection and upload
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !onUploadAttachment) return;

      for (const file of Array.from(files)) {
        try {
          const uploaded = await onUploadAttachment(file);
          if (uploaded) {
            setPendingAttachments((prev) => [...prev, uploaded]);
          }
        } catch (error) {
          console.error('Failed to upload file:', error);
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onUploadAttachment]
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSend = () => {
    const trimmed = message.trim();
    const hasContent = trimmed || pendingAttachments.length > 0;

    if (hasContent && !disabled && !isUploading) {
      if (editingMessage) {
        onEditSave?.(editingMessage.id, trimmed);
        setMessage('');
        onCancelEdit?.();
      } else {
        shouldRefocusRef.current = true;
        const attachmentData = convertAttachmentsToData(pendingAttachments);
        onSend(
          trimmed,
          replyToMessage?.id,
          attachmentData.length > 0 ? attachmentData : undefined
        );
        setMessage('');
        setPendingAttachments([]);
        onCancelReply?.();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      if (editingMessage) {
        setMessage('');
        onCancelEdit?.();
      } else if (replyToMessage) {
        onCancelReply?.();
      }
    }
  };

  const canSend =
    (message.trim() || pendingAttachments.length > 0) && !disabled && !isUploading;

  return (
    <div className="border-t border-border bg-background">
      {replyToMessage && (
        <ReplyPreview message={replyToMessage} onCancel={onCancelReply ?? (() => {})} />
      )}

      {editingMessage && <EditPreview onCancel={onCancelEdit ?? (() => {})} />}

      {pendingAttachments.length > 0 && !editingMessage && (
        <div className="px-3 pt-3 pb-1">
          <AttachmentPreview
            attachments={pendingAttachments}
            onRemove={handleRemoveAttachment}
          />
        </div>
      )}

      {/* Input area */}
      <div className="p-3">
        <div className="flex items-end gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          />

          {/* Attachment button */}
          {!editingMessage && onUploadAttachment && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleAttachClick}
              disabled={disabled || isUploading}
              className="h-10 w-10 flex-shrink-0"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
          )}

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingMessage ? 'Edit message...' : 'Type a message...'}
            disabled={disabled || isUploading}
            className="min-h-[40px] max-h-[120px] resize-none py-2.5"
            rows={1}
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
            className="h-10 w-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
