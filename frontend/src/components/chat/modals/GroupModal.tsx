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
import { 
  X, 
  Users, 
  LogOut, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Shield 
} from 'lucide-react';
import type { Conversation } from '@/types/conversation.types';
import type { Attachment } from '@/types/message.types';
import type { UserWithStatus } from '@/types/user.types';
import { MemberRole } from '@/types/enums';
import { SharedAttachments } from './SharedAttachments';
import { MembersList } from './MembersList';
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
  availableUsers?: UserWithStatus[];
  isLoading?: boolean;
  getUserStatus?: (userId: string) => UserWithStatus | undefined;
  onLeaveGroup?: () => void;
  onKickMember?: (userId: string) => void;
  onInviteUsers?: (userIds: string[]) => void;
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

export function GroupModal({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  images = [],
  files = [],
  availableUsers = [],
  isLoading = false,
  getUserStatus,
  onLeaveGroup,
  onKickMember,
  onInviteUsers,
  onUpdateSettings,
  onUpdateRoles,
}: GroupModalProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showKickModal, setShowKickModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);

  const currentMember = conversation.members.find(m => m.userId === currentUserId);
  const currentUserRole = currentMember?.role || MemberRole.MEMBER;
  const isAdmin = currentUserRole === MemberRole.ADMIN;
  const isOwner = conversation.createdById === currentUserId;
  const canModerate = isAdmin || isOwner;

  const groupName = conversation.name || 'Unnamed Group';
  const memberCount = conversation._count?.members || conversation.members.length;

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

              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 -mt-2 -mr-2"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
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
              maxVisible={6}
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
            />

            {/* Moderation Actions (Admin/Owner only) */}
            {canModerate && (
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
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Group
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
        existingMemberIds={conversation.members.map(m => m.userId)}
        availableUsers={availableUsers}
        onInviteUsers={onInviteUsers}
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
        members={conversation.members}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        createdById={conversation.createdById}
        conversationName={groupName}
        getUserStatus={getUserStatus}
        onUpdateRoles={onUpdateRoles}
      />
    </>
  );
}

