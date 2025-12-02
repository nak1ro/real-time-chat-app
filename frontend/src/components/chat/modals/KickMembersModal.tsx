'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  ScrollArea,
  Input,
} from '@/components/ui';
import { Search, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationMember } from '@/types/conversation.types';
import type { UserWithStatus } from '@/types/user.types';
import { Status } from '@/types/enums';
import { ConfirmationDialog } from './ConfirmationDialog';

interface KickMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: ConversationMember[];
  currentUserId: string;
  conversationName: string;
  getUserStatus?: (userId: string) => UserWithStatus | undefined;
  onKickMember?: (memberId: string) => void;
}

function getInitials(name: string): string {
  return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
}

export function KickMembersModal({
                                   open,
                                   onOpenChange,
                                   members,
                                   currentUserId,
                                   conversationName,
                                   getUserStatus,
                                   onKickMember,
                                 }: KickMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [memberToKick, setMemberToKick] = useState<ConversationMember | null>(null);

  // Filter out current user from kickable members
  const kickableMembers = members.filter(m => m.userId !== currentUserId);

  const filteredMembers = searchQuery
      ? kickableMembers.filter(m =>
          m.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : kickableMembers;

  const handleKick = (member: ConversationMember) => {
    setMemberToKick(member);
  };

  const confirmKick = () => {
    if (memberToKick) {
      onKickMember?.(memberToKick.userId);
      // Clear local state and close modal after confirming action
      setMemberToKick(null);
      setSearchQuery('');
      onOpenChange(false);
    }
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset local state when dialog is closed
      setSearchQuery('');
      setMemberToKick(null);
    }
    onOpenChange(nextOpen);
  };

  return (
      <>
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="sm:max-w-[450px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserMinus className="h-5 w-5" />
                Kick Members
              </DialogTitle>
              <DialogDescription>
                Remove members from {conversationName}
              </DialogDescription>
            </DialogHeader>

            {kickableMembers.length > 5 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                  />
                </div>
            )}

            <ScrollArea className="flex-1 -mx-6 px-6">
              {filteredMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <UserMinus className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchQuery ? 'No members found' : 'No members to kick'}
                    </p>
                  </div>
              ) : (
                  <div className="space-y-1 py-2">
                    {filteredMembers.map((member) => {
                      const userStatus = getUserStatus?.(member.userId);
                      const isOnline = userStatus?.status === Status.ONLINE;

                      return (
                          <div
                              key={member.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                          >
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.user.avatarUrl || undefined} alt={member.user.name} />
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                  {getInitials(member.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              {isOnline && (
                                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{member.user.name}</p>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                                onClick={() => handleKick(member)}
                            >
                              Kick
                            </Button>
                          </div>
                      );
                    })}
                  </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Kick Confirmation */}
        <ConfirmationDialog
            open={!!memberToKick}
            onOpenChange={(open) => !open && setMemberToKick(null)}
            title="Kick Member"
            description={`Kick ${memberToKick?.user.name} from ${conversationName}? They will need to be re-invited to join again.`}
            confirmLabel="Kick"
            variant="destructive"
            onConfirm={confirmKick}
        />
      </>
  );
}
