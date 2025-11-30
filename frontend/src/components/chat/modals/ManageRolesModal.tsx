'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  ScrollArea,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@/components/ui';
import { Search, Shield, Crown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationMember } from '@/types/conversation.types';
import type { UserWithStatus } from '@/types/user.types';
import { MemberRole, Status } from '@/types/enums';

interface ManageRolesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: ConversationMember[];
  currentUserId: string;
  currentUserRole: MemberRole;
  createdById?: string | null;
  conversationName: string;
  getUserStatus?: (userId: string) => UserWithStatus | undefined;
  onUpdateRoles?: (updates: { userId: string; role: MemberRole }[]) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
  
  return (
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
      Member
    </Badge>
  );
}

export function ManageRolesModal({
  open,
  onOpenChange,
  members,
  currentUserId,
  currentUserRole,
  createdById,
  conversationName,
  getUserStatus,
  onUpdateRoles,
}: ManageRolesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleChanges, setRoleChanges] = useState<Map<string, MemberRole>>(new Map());

  const isOwner = currentUserId === createdById;
  
  // Get members that current user can manage (can't manage self, owner, or equal/higher roles)
  const manageableMembers = members.filter(m => {
    if (m.userId === currentUserId) return false; // Can't manage self
    if (m.userId === createdById) return false; // Can't manage owner
    
    // Admin can only manage members
    if (currentUserRole === MemberRole.ADMIN && m.role === MemberRole.ADMIN) {
      return false;
    }
    
    return true;
  });
  
  const filteredMembers = searchQuery
    ? manageableMembers.filter(m => 
        m.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : manageableMembers;

  const handleRoleChange = (userId: string, newRole: MemberRole) => {
    const newChanges = new Map(roleChanges);
    const originalMember = members.find(m => m.userId === userId);
    
    if (originalMember && originalMember.role === newRole) {
      newChanges.delete(userId);
    } else {
      newChanges.set(userId, newRole);
    }
    
    setRoleChanges(newChanges);
  };

  const getCurrentRole = (member: ConversationMember): MemberRole => {
    return roleChanges.get(member.userId) || member.role;
  };

  const handleSave = () => {
    if (roleChanges.size > 0) {
      const updates = Array.from(roleChanges.entries()).map(([userId, role]) => ({
        userId,
        role,
      }));
      onUpdateRoles?.(updates);
    }
    setRoleChanges(new Map());
    onOpenChange(false);
  };

  const handleClose = () => {
    setRoleChanges(new Map());
    onOpenChange(false);
  };

  // Available roles based on current user's role
  const availableRoles = isOwner 
    ? [MemberRole.MEMBER, MemberRole.ADMIN]
    : [MemberRole.MEMBER]; // Admins can only manage member role

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Roles
          </DialogTitle>
          <DialogDescription>
            Change member roles in {conversationName}
          </DialogDescription>
        </DialogHeader>

        {manageableMembers.length > 5 && (
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
              <Users className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No members found' : 'No members to manage'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {filteredMembers.map((member) => {
                const userStatus = getUserStatus?.(member.userId);
                const isOnline = userStatus?.status === Status.ONLINE;
                const currentRole = getCurrentRole(member);
                const hasChange = roleChanges.has(member.userId);
                
                return (
                  <div
                    key={member.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      hasChange ? 'border-primary bg-primary/5' : 'border-border'
                    )}
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
                        <RoleBadge role={member.role} isOwner={member.userId === createdById} />
                      </div>
                      {hasChange && (
                        <p className="text-xs text-primary mt-0.5">
                          → Will be changed to {currentRole}
                        </p>
                      )}
                    </div>
                    
                    <Select
                      value={currentRole}
                      onValueChange={(value) => handleRoleChange(member.userId, value as MemberRole)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role === MemberRole.ADMIN ? 'Admin' : 'Member'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={roleChanges.size === 0}>
            Save Changes {roleChanges.size > 0 && `(${roleChanges.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

