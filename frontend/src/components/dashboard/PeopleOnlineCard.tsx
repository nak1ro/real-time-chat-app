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
} from '@/components/ui';
import { cn } from '@/lib/utils';

type UserStatus = 'online' | 'away' | 'busy';

interface OnlineUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  status: UserStatus;
}

// Mock data for online users
const onlineUsers: OnlineUser[] = [
  { id: '1', name: 'Sarah Chen', username: 'sarahc', status: 'online' },
  { id: '2', name: 'Alex Rivera', username: 'alexr', status: 'online' },
  { id: '3', name: 'Jordan Kim', username: 'jordank', status: 'away' },
  { id: '4', name: 'Taylor Swift', username: 'tswift', status: 'online' },
  { id: '5', name: 'Morgan Lee', username: 'morganl', status: 'busy' },
  { id: '6', name: 'Casey Brown', username: 'caseyb', status: 'online' },
  { id: '7', name: 'Jamie Wilson', username: 'jamiew', status: 'away' },
  { id: '8', name: 'Drew Parker', username: 'drewp', status: 'online' },
];

const statusColors: Record<UserStatus, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  busy: 'bg-rose-500',
};

const statusLabels: Record<UserStatus, string> = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
};

function UserItem({ user }: { user: OnlineUser }) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="relative flex-shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
            statusColors[user.status]
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
      </div>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {statusLabels[user.status]}
      </span>
    </div>
  );
}

export function PeopleOnlineCard() {
  const onlineCount = onlineUsers.filter((u) => u.status === 'online').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">People online</CardTitle>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {onlineCount} online
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[280px] -mx-1 pr-3">
          <div className="space-y-0.5">
            {onlineUsers.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

