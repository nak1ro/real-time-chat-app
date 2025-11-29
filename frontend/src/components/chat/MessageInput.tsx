'use client';

// Message input component
import { useState, useRef, useEffect } from 'react';
import { Button, Textarea } from '@/components/ui';
import { Send, X } from 'lucide-react';
import type { Message } from '@/types';

interface MessageInputProps {
  onSend: (content: string, replyToId?: string) => void;
  disabled?: boolean;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  onEditSave?: (messageId: string, text: string) => void;
}

export function MessageInput({
  onSend,
  disabled = false,
  replyToMessage,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onEditSave,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldRefocusRef = useRef(false);

  // Set message when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.text);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Refocus when disabled becomes false after sending
  useEffect(() => {
    if (!disabled && shouldRefocusRef.current) {
      shouldRefocusRef.current = false;
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      if (editingMessage) {
        // Save edited message
        onEditSave?.(editingMessage.id, trimmed);
        setMessage('');
        onCancelEdit?.();
      } else {
        // Send new message
        shouldRefocusRef.current = true;
        onSend(trimmed, replyToMessage?.id);
        setMessage('');
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

  return (
    <div className="border-t border-border bg-background">
      {/* Reply Preview */}
      {replyToMessage && (
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-2 border-l-2 border-primary">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">
                Replying to {replyToMessage.user?.name || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyToMessage.text}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onCancelReply}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Preview */}
      {editingMessage && (
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
              onClick={() => {
                setMessage('');
                onCancelEdit?.();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            disabled={disabled}
            className="min-h-[40px] max-h-[120px] resize-none py-2.5"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="h-10 w-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
