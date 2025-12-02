'use client';

import {useState, useMemo} from 'react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Badge,
    Button,
    Input,
    ScrollArea,
    Skeleton
} from '@/components/ui';
import {Search, Crown, Shield, Users} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {ConversationMember} from '@/types/conversation.types';
import type {UserWithStatus} from '@/types/user.types';
import {MemberRole, Status} from '@/types/enums';

// Utility function to get initials from a name
function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Utility function to format last seen time
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
    return lastSeen.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
}

// Component to display the member's role badge
function RoleBadge({role, isOwner}: { role: MemberRole; isOwner: boolean }) {
    if (isOwner) {
        return (
            <Badge variant="default"
                   className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] px-1.5 py-0">
                <Crown className="h-2.5 w-2.5 mr-0.5"/>
                Owner
            </Badge>
        );
    }

    if (role === MemberRole.ADMIN) {
        return (
            <Badge variant="default"
                   className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-[10px] px-1.5 py-0">
                <Shield className="h-2.5 w-2.5 mr-0.5"/>
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

// Component to render an individual member item
function MemberItem({
                        member,
                        isOwner,
                        userStatus,
                        onClick
                    }: {
    member: ConversationMember;
    isOwner: boolean;
    userStatus?: UserWithStatus;
    onClick?: () => void;
}) {
    const isOnline = userStatus?.status === Status.ONLINE;
    const lastSeenText = formatLastSeen(userStatus?.lastSeenAt || null, userStatus?.status || null);

    return (
        <button
            className={cn(
                'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                'hover:bg-muted/50',
                onClick && 'cursor-pointer'
            )}
            onClick={onClick}
            disabled={!onClick}
        >
            <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={member.user.avatarUrl || undefined} alt={member.user.name}/>
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(member.user.name)}
                    </AvatarFallback>
                </Avatar>
                {isOnline && (
                    <span
                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background"/>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{member.user.name}</span>
                    <RoleBadge role={member.role} isOwner={isOwner}/>
                </div>
                <p className={cn(
                    'text-xs',
                    isOnline ? 'text-emerald-600' : 'text-muted-foreground'
                )}>
                    {lastSeenText}
                </p>
            </div>
        </button>
    );
}

// Component for a skeleton loader member item
function MemberSkeleton() {
    return (
        <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full"/>
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32"/>
                <Skeleton className="h-3 w-20"/>
            </div>
        </div>
    );
}

// Main component interfaces
interface MembersListProps {
    members: ConversationMember[];
    currentUserId: string;
    createdById?: string | null;
    showSearch?: boolean;
    maxVisible?: number;
    isLoading?: boolean;
    onViewAll?: () => void;
    onMemberClick?: (member: ConversationMember) => void;
    getUserStatus?: (userId: string) => UserWithStatus | undefined;
}

// Component to render the loading state
function MembersListLoading() {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4"/>
                    Members
                </h3>
            </div>
            <div className="space-y-1">
                {Array.from({length: 5}).map((_, i) => (
                    <MemberSkeleton key={i}/>
                ))}
            </div>
        </div>
    );
}

// Component to display the no members state
function NoMembers({searchQuery}: { searchQuery: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mb-2 opacity-50"/>
            <p className="text-sm">
                {searchQuery ? 'No members found' : 'No members yet'}
            </p>
        </div>
    );
}

// Main component
export function MembersList({
                                members,
                                createdById,
                                showSearch = false,
                                maxVisible,
                                isLoading = false,
                                onViewAll,
                                onMemberClick,
                                getUserStatus,
                            }: MembersListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter members based on search query
    const filteredMembers = useMemo(() => {
        if (!searchQuery) return members;
        const query = searchQuery.toLowerCase();
        return members.filter(m =>
            m.user.name.toLowerCase().includes(query)
        );
    }, [members, searchQuery]);

    // Determine which members are visible
    const visibleMembers = useMemo(() => {
        return maxVisible
            ? filteredMembers.slice(0, maxVisible)
            : filteredMembers;
    }, [filteredMembers, maxVisible]);

    // Show loading state if loading
    if (isLoading) {
        return <MembersListLoading/>;
    }

    const hasMore = maxVisible && filteredMembers.length > maxVisible;
    const showSearchBar = showSearch && members.length > 5;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4"/>
                    Members ({members.length})
                </h3>
            </div>

            {showSearchBar && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            )}

            {filteredMembers.length === 0 ? (
                <NoMembers searchQuery={searchQuery}/>
            ) : (
                <ScrollArea className={maxVisible ? 'max-h-[300px]' : undefined}>
                    <div className="space-y-1">
                        {visibleMembers.map((member) => (
                            <MemberItem
                                key={member.id}
                                member={member}
                                isOwner={member.userId === createdById}
                                userStatus={getUserStatus?.(member.userId)}
                                onClick={onMemberClick ? () => onMemberClick(member) : undefined}
                            />
                        ))}
                    </div>
                </ScrollArea>
            )}

            {hasMore && (
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={onViewAll}
                >
                    View All Members ({members.length})
                </Button>
            )}
        </div>
    );
}