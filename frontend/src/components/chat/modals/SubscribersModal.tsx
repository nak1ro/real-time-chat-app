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
  Badge,
  Button,
  ScrollArea,
  Input,
} from '@/components/ui';
import { Search, Users, Crown, Shield, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationMember } from '@/types/conversation.types';
import type { UserWithStatus } from '@/types/user.types';
import { MemberRole, Status } from '@/types/enums';
import { ConfirmationDialog } from './ConfirmationDialog';

interface SubscribersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: ConversationMember[];
  totalCount: number;
  currentUserId: string;
  /** Whether current user has elevated privileges (Admin OR Owner) */
  isElevated?: boolean;
  createdById?: string | null;
  channelName: string;
  getUserStatus?: (userId: string) => UserWithStatus | undefined;
  onRemoveSubscriber?: (userId: string) => void;
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
  if (status === Status.ONLINE) return 'online';
  if (!lastSeenAt) return 'offline';
  
  const now = new Date();
  const lastSeen = new Date(lastSeenAt);
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return lastSeen.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function RoleBadge({ role, isOwner }: { role: MemberRole; isOwner: boolean }) {
  if (isOwner) {
    return (
      <Badge variant="default" className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] px-1.5 py-0">
        <Crown className="h-2.5 w-2.5 mr-0.5" />
        Owner
      </Badge>
    );
  }
  
  if (role === MemberRole.ADMIN) {
    return (
      <Badge variant="default" className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-[10px] px-1.5 py-0">
        <Shield className="h-2.5 w-2.5 mr-0.5" />
        Admin
      </Badge>
    );
  }
  
  return null; // Don't show badge for regular subscribers
}

export function SubscribersModal({
  open,
  onOpenChange,
  members,
  totalCount,
  currentUserId,
  isElevated = false,
  createdById,
  channelName,
  getUserStatus,
  onRemoveSubscriber,
}: SubscribersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<ConversationMember | null>(null);
  
  const filteredMembers = searchQuery
    ? members.filter(m => 
        m.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  const handleRemove = (member: ConversationMember) => {
    setMemberToRemove(member);
  };

  const confirmRemove = () => {
    if (memberToRemove) {
      onRemoveSubscriber?.(memberToRemove.userId);
      setMemberToRemove(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Subscribers ({totalCount.toLocaleString()})
            </DialogTitle>
            <DialogDescription>
              People subscribed to {channelName}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscribers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? 'No subscribers found' : 'No subscribers yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-1 py-2">
                {filteredMembers.map((member) => {
                  const userStatus = getUserStatus?.(member.userId);
                  const isOnline = userStatus?.status === Status.ONLINE;
                  const isMemberOwner = member.userId === createdById;
                  const isSelf = member.userId === currentUserId;
                  const canRemove = isElevated && !isSelf && !isMemberOwner;
                  
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{member.user.name}</p>
                          <RoleBadge role={member.role} isOwner={isMemberOwner} />
                        </div>
                        <p className={cn(
                          'text-xs',
                          isOnline ? 'text-emerald-600' : 'text-muted-foreground'
                        )}>
                          {formatLastSeen(userStatus?.lastSeenAt || null, userStatus?.status || null)}
                        </p>
                      </div>
                      
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={() => handleRemove(member)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <ConfirmationDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove Subscriber"
        description={`Remove ${memberToRemove?.user.name} from ${channelName}?`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmRemove}
      />
    </>
  );
}

