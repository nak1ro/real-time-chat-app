'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Separator,
} from '@/components/ui';
import { X, MessageCircle, Trash2, Ban, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation, ConversationMember } from '@/types/conversation.types';
import type { Attachment } from '@/types/message.types';
import type { UserWithStatus } from '@/types/user.types';
import { Status } from '@/types/enums';
import { SharedAttachments } from './SharedAttachments';
import { ConfirmationDialog } from './ConfirmationDialog';

interface DirectMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  currentUserId: string;
  otherUser: UserWithStatus;
  images?: Attachment[];
  files?: Attachment[];
  isLoading?: boolean;
  isError?: boolean;
  isDeleting?: boolean;
  onRetryAttachments?: () => void;
  onStartMessaging?: () => void;
  onDeleteChat?: () => void;
  onBlockUser?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatLastSeen(lastSeenAt: Date | null, status: Status | null): string {
  if (status === Status.ONLINE) return 'Online';
  if (!lastSeenAt) return 'Offline';
  
  const now = new Date();
  const lastSeen = new Date(lastSeenAt);
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Last seen just now';
  if (diffMins < 60) return `Last seen ${diffMins} min ago`;
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  if (diffDays < 7) return `Last seen ${diffDays}d ago`;
  return `Last seen ${lastSeen.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function DirectMessageModal({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  otherUser,
  images = [],
  files = [],
  isLoading = false,
  isError = false,
  isDeleting = false,
  onRetryAttachments,
  onStartMessaging,
  onDeleteChat,
  onBlockUser,
}: DirectMessageModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const isOnline = otherUser.status === Status.ONLINE;
  const lastSeenText = formatLastSeen(otherUser.lastSeenAt, otherUser.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={otherUser.avatarUrl || undefined} alt={otherUser.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(otherUser.name)}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 pt-1">
                <DialogTitle className="text-xl font-semibold truncate">
                  {otherUser.name}
                </DialogTitle>
                <p className={cn(
                  'text-sm mt-1',
                  isOnline ? 'text-emerald-600' : 'text-muted-foreground'
                )}>
                  {lastSeenText}
                </p>
              </div>
            </div>

            {onStartMessaging && (
              <Button 
                className="w-full mt-4" 
                onClick={() => {
                  onStartMessaging();
                  onOpenChange(false);
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Messaging
              </Button>
            )}
          </DialogHeader>

          <Separator />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Attachments Section */}
            <SharedAttachments
              images={images}
              files={files}
              isLoading={isLoading}
              isError={isError}
              maxVisible={6}
              onRetry={onRetryAttachments}
            />
          </div>

          <Separator />

          {/* Bottom Actions */}
          <div className="p-4 space-y-2">
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => setShowBlockConfirm(true)}
              disabled={isDeleting}
            >
              <Ban className="h-4 w-4 mr-2" />
              Block User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Chat"
        description={`Delete chat with ${otherUser.name}? This action cannot be undone and all messages will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          onDeleteChat?.();
          onOpenChange(false);
        }}
      />

      {/* Block Confirmation */}
      <ConfirmationDialog
        open={showBlockConfirm}
        onOpenChange={setShowBlockConfirm}
        title="Block User"
        description={`Block ${otherUser.name}? They won't be able to send you messages or see when you're online.`}
        confirmLabel="Block"
        variant="destructive"
        onConfirm={() => {
          onBlockUser?.();
          onOpenChange(false);
        }}
      />
    </>
  );
}

