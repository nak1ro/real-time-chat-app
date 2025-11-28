'use client';

// Profile and quick actions card component
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
} from '@/components/ui';
import { Pencil, Plus } from 'lucide-react';
import { UpdateProfileModal } from '@/components/profile';

interface ProfileActionsCardProps {
  isOnline?: boolean;
}

export function ProfileActionsCard({ isOnline = true }: ProfileActionsCardProps) {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
                <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
                  {user?.name ? getInitials(user.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${isOnline ? 'bg-emerald-500' : 'bg-zinc-400'
                  }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-sm text-muted-foreground truncate">
                @{user?.name?.toLowerCase().replace(/\s+/g, '') || 'username'}
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

          {/* Presence Status (read-only) */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-zinc-400'}`}
              />
              <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          <Separator />

          {/* Create Chat Action */}
          <Button className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Create chat or channel
          </Button>
        </CardContent>
      </Card>

      <UpdateProfileModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
    </>
  );
}

