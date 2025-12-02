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
  Users,
  LogOut,
  Settings,
  UserPlus,
  UserMinus,
  Shield,
  Loader2
} from 'lucide-react';
import type { Conversation, ConversationMember } from '@/types/conversation.types';
import type { Attachment } from '@/types/message.types';
import type { UserWithStatus } from '@/types/user.types';
import { MemberRole } from '@/types/enums';
import { SharedAttachments } from '../conversation-view/SharedAttachments';
import { MembersList } from '../conversation-view/MembersList';
import { ConfirmationDialog } from './ConfirmationDialog';
import { KickMembersModal } from './KickMembersModal';
import { InviteMembersModal } from './InviteMembersModal';
import { ConversationSettingsModal } from './ConversationSettingsModal';
import { ManageRolesModal } from './ManageRolesModal';

interface GroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  currentUserId: string;
  images?: Attachment[];
  files?: Attachment[];
  isLoading?: boolean;
  isError?: boolean;
  isLeaving?: boolean;
  isSavingSettings?: boolean;
  // Role-based permissions
  isElevated?: boolean;
  isOwner?: boolean;
  isRoleLoading?: boolean;
  currentUserRole?: MemberRole | null;
  getUserStatus?: (userId: string) => UserWithStatus | undefined;
  onRetryAttachments?: () => void;
  onLeaveGroup?: () => void;
  onKickMember?: (userId: string) => void;
  onInviteUsers?: (userIds: string[]) => void;
  onUpdateSettings?: (data: { name?: string; description?: string; avatarUrl?: string }) => void;
  onUpdateRoles?: (updates: { userId: string; role: MemberRole }[]) => void;
  onMemberClick?: (member: ConversationMember) => void;
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

export function GroupModal({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  images = [],
  files = [],
  isLoading = false,
  isError = false,
  isLeaving = false,
  isSavingSettings = false,
  isElevated = false,
  isOwner = false,
  isRoleLoading = false,
  currentUserRole,
  getUserStatus,
  onRetryAttachments,
  onLeaveGroup,
  onKickMember,
  onInviteUsers,
  onUpdateSettings,
  onUpdateRoles,
  onMemberClick,
}: GroupModalProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showKickModal, setShowKickModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);

  const groupName = conversation.name || 'Unnamed Group';
  const memberCount = conversation._count?.members || conversation.members?.length || 0;

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
                <AvatarImage src={conversation.avatarUrl || undefined} alt={groupName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  <Users className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 pt-1">
                <DialogTitle className="text-xl font-semibold truncate">
                  {groupName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {memberCount} members
                </p>
                {conversation.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {conversation.description}
                  </p>
                )}
              </div>
            </div>
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

            <Separator />

            {/* Members Section */}
            <MembersList
              members={conversation.members}
              currentUserId={currentUserId}
              createdById={conversation.createdById}
              showSearch={conversation.members.length > 5}
              maxVisible={15}
              isLoading={isLoading}
              getUserStatus={getUserStatus}
              onMemberClick={onMemberClick}
            />

            {/* Moderation Actions (Admin/Owner only) */}
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
                    <Shield className="h-4 w-4" />
                    Moderation Actions
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setShowKickModal(true)}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Kick Members
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setShowInviteModal(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Group Settings (Admin/Owner only) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Group Settings
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setShowSettingsModal(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Group
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setShowRolesModal(true)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Manage Roles
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Bottom Actions */}
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => setShowLeaveConfirm(true)}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Group
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation */}
      <ConfirmationDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="Leave Group"
        description={`Leave ${groupName}? You'll need to be re-invited to join again.`}
        confirmLabel="Leave"
        variant="destructive"
        onConfirm={() => {
          onLeaveGroup?.();
          onOpenChange(false);
        }}
      />

      {/* Kick Members Modal */}
      <KickMembersModal
        open={showKickModal}
        onOpenChange={setShowKickModal}
        members={conversation.members}
        currentUserId={currentUserId}
        conversationName={groupName}
        getUserStatus={getUserStatus}
        onKickMember={onKickMember}
      />

      {/* Invite Members Modal */}
      <InviteMembersModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        conversationName={groupName}
        conversationSlug={conversation.slug}
        existingMemberIds={conversation.members?.map(m => m.userId) || []}
        onInviteUsers={onInviteUsers}
      />

      {/* Settings Modal */}
      <ConversationSettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        conversation={conversation}
        isSaving={isSavingSettings}
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
        conversationName={groupName}
        getUserStatus={getUserStatus}
        onUpdateRoles={onUpdateRoles}
      />
    </>
  );
}

