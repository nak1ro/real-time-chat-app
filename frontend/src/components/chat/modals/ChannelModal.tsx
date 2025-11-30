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
  Skeleton,
} from '@/components/ui';
import { 
  X, 
  Megaphone, 
  LogOut, 
  Settings, 
  Users, 
  Shield,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Conversation } from '@/types/conversation.types';
import type { Attachment } from '@/types/message.types';
import type { UserWithStatus } from '@/types/user.types';
import { MemberRole } from '@/types/enums';
import { SharedAttachments } from './SharedAttachments';
import { ConfirmationDialog } from './ConfirmationDialog';
import { SubscribersModal } from './SubscribersModal';
import { ConversationSettingsModal } from './ConversationSettingsModal';
import { ManageRolesModal } from './ManageRolesModal';

interface ChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  currentUserId: string;
  images?: Attachment[];
  files?: Attachment[];
  isLoading?: boolean;
  // Role-based permissions
  isElevated?: boolean;
  isOwner?: boolean;
  isRoleLoading?: boolean;
  currentUserRole?: MemberRole | null;
  getUserStatus?: (userId: string) => UserWithStatus | undefined;
  onLeaveChannel?: () => void;
  onDeleteChannel?: () => void;
  onRemoveSubscriber?: (userId: string) => void;
  onUpdateSettings?: (data: { name?: string; description?: string; avatarUrl?: string }) => void;
  onUpdateRoles?: (updates: { userId: string; role: MemberRole }[]) => void;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ChannelModal({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  images = [],
  files = [],
  isLoading = false,
  isElevated = false,
  isOwner = false,
  isRoleLoading = false,
  currentUserRole,
  getUserStatus,
  onLeaveChannel,
  onDeleteChannel,
  onRemoveSubscriber,
  onUpdateSettings,
  onUpdateRoles,
}: ChannelModalProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const channelName = conversation.name || 'Unnamed Channel';
  const subscriberCount = conversation._count?.members || conversation.members?.length || 0;
  const description = conversation.description || '';
  const shouldTruncateDescription = description.length > 150;
  
  // Use passed-in role or fallback to computing from members
  const effectiveRole = currentUserRole ?? conversation.members?.find(m => m.userId === currentUserId)?.role ?? MemberRole.MEMBER;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarImage src={conversation.avatarUrl || undefined} alt={channelName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  <Megaphone className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 pt-1">
                <DialogTitle className="text-xl font-semibold truncate">
                  {channelName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscriberCount.toLocaleString()} subscribers
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 -mt-2 -mr-2"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Description */}
            {description && (
              <div className="mt-4">
                <p className={`text-sm text-muted-foreground ${!descriptionExpanded && shouldTruncateDescription ? 'line-clamp-3' : ''}`}>
                  {description}
                </p>
                {shouldTruncateDescription && (
                  <button
                    className="text-sm text-primary hover:underline mt-1 flex items-center gap-1"
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  >
                    {descriptionExpanded ? (
                      <>
                        Show less <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
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
              maxVisible={6}
            />

            <Separator />

            {/* Subscribers Section */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowSubscribersModal(true)}
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Subscribers ({subscriberCount.toLocaleString()})
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Channel Settings (Admin/Owner only) */}
            {isRoleLoading ? (
              <>
                <Separator />
                <div className="space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </>
            ) : isElevated && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Channel Settings
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setShowSettingsModal(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Channel
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setShowRolesModal(true)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Manage Admins
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Bottom Actions */}
          <div className="p-4 space-y-2">
            {isOwner ? (
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Channel
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => setShowLeaveConfirm(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Channel
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation */}
      <ConfirmationDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="Leave Channel"
        description={`Leave ${channelName}? You can rejoin anytime since this is a public channel.`}
        confirmLabel="Leave"
        variant="destructive"
        onConfirm={() => {
          onLeaveChannel?.();
          onOpenChange(false);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Channel"
        description={`Delete ${channelName}? This action cannot be undone and all messages will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          onDeleteChannel?.();
          onOpenChange(false);
        }}
      />

      {/* Subscribers Modal */}
      <SubscribersModal
        open={showSubscribersModal}
        onOpenChange={setShowSubscribersModal}
        members={conversation.members || []}
        totalCount={subscriberCount}
        currentUserId={currentUserId}
        isElevated={isElevated}
        createdById={conversation.createdById}
        channelName={channelName}
        getUserStatus={getUserStatus}
        onRemoveSubscriber={onRemoveSubscriber}
      />

      {/* Settings Modal */}
      <ConversationSettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        conversation={conversation}
        onSave={onUpdateSettings}
      />

      {/* Manage Roles Modal */}
      <ManageRolesModal
        open={showRolesModal}
        onOpenChange={setShowRolesModal}
        members={conversation.members || []}
        currentUserId={currentUserId}
        currentUserRole={effectiveRole}
        createdById={conversation.createdById}
        conversationName={channelName}
        getUserStatus={getUserStatus}
        onUpdateRoles={onUpdateRoles}
      />
    </>
  );
}

