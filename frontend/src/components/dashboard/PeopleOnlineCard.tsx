'use client';

// People online card with user list
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Avatar,
  AvatarFallback,
  AvatarImage,
  ScrollArea,
  Skeleton,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useOnlineContacts } from '@/hooks/useUsers';
import type { OnlineContact } from '@/types';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function UserItem({ user }: { user: OnlineContact }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="relative flex-shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
          <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
            'bg-emerald-500'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
      </div>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        Online
      </span>
    </div>
  );
}

function UserItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-center px-4">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <span className="text-2xl">👋</span>
      </div>
      <p className="text-sm font-medium text-muted-foreground">No contacts online</p>
      <p className="text-xs text-muted-foreground mt-1">
        Start a conversation to see your contacts here
      </p>
    </div>
  );
}

export function PeopleOnlineCard() {
  const { data: contacts, isLoading, isError } = useOnlineContacts();

  const onlineCount = contacts?.length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">People online</CardTitle>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {isLoading ? '...' : `${onlineCount} online`}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[280px] -mx-1 pr-3">
          {isLoading ? (
            <div className="space-y-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <UserItemSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              Failed to load contacts
            </div>
          ) : onlineCount === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-0.5">
              {contacts?.map((user) => (
                <UserItem key={user.id} user={user} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

