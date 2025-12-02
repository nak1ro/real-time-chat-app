'use client';

// Profile and quick actions card component
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPresence } from '@/hooks/useUsers';
import { Status } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Separator,
  Skeleton,
} from '@/components/ui';
import { Pencil, Plus } from 'lucide-react';
import { UpdateProfileModal } from '@/components/profile';
import { CreateChannelModal } from '@/components/chat';

export function ProfileActionsCard() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { data: presence, isLoading: isPresenceLoading } = useUserPresence(user?.id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Derive status from presence API or fall back to user.status
  const status = presence?.status ?? user?.status ?? Status.OFFLINE;
  const isOnline = status === Status.ONLINE;

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate nickname from name (lowercase, no spaces)
  const getNickname = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '');
  };

  // Format status display text
  const getStatusText = (s: Status) => {
    switch (s) {
      case Status.ONLINE:
        return 'Online';
      case Status.OFFLINE:
        return 'Offline';
      default:
        return 'Offline';
    }
  };

  // Get status indicator color
  const getStatusColor = (s: Status) => {
    switch (s) {
      case Status.ONLINE:
        return 'bg-emerald-500';
      case Status.OFFLINE:
        return 'bg-zinc-400';
      default:
        return 'bg-zinc-400';
    }
  };

  // Handle create chat/channel click
  const handleCreateChat = () => {
    setIsCreateModalOpen(true);
  };

  // Loading skeleton
  if (isUserLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">My profile & actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Separator />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">My profile & actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name} />
                <AvatarFallback className="text-lg font-medium gradient-avatar-blue text-white">
                  {user?.name ? getInitials(user.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${getStatusColor(status)}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-sm text-muted-foreground truncate">
                @{user?.name ? getNickname(user.name) : 'username'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>

          <Separator />

          {/* Presence Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              {isPresenceLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <>
                  <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(status)}`} />
                  <span className="text-sm font-medium">{getStatusText(status)}</span>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Create Chat/Channel Action */}
          <Button className="w-full gap-2" onClick={handleCreateChat}>
            <Plus className="h-4 w-4" />
            Create chat or channel
          </Button>
        </CardContent>
      </Card>

      <UpdateProfileModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
      <CreateChannelModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </>
  );
}
