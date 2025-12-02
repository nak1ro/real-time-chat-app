'use client';

import {useState, useEffect, useMemo} from 'react';
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
    Skeleton,
} from '@/components/ui';
import {Search, UserPlus, Check, Copy, Loader2} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {UserWithStatus} from '@/types/user.types';
import type {User} from '@/types/user.types';
import {useUserSearch} from '@/hooks';

interface InviteMembersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversationName: string;
    conversationSlug?: string | null;
    existingMemberIds: string[];
    onInviteUsers?: (userIds: string[]) => void;
    onCopyInviteLink?: () => void;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function InviteMembersModal({
                                       open,
                                       onOpenChange,
                                       conversationName,
                                       conversationSlug,
                                       existingMemberIds,
                                       onInviteUsers,
                                       onCopyInviteLink,
                                   }: InviteMembersModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [linkCopied, setLinkCopied] = useState(false);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setSearchQuery('');
            setDebouncedQuery('');
            setSelectedUserIds(new Set());
        }
    }, [open]);

    // Search users from backend
    const {
        data: searchResults = [],
        isLoading: isSearching,
        isFetching,
    } = useUserSearch(debouncedQuery, {
        enabled: debouncedQuery.length >= 2
    });

    // Filter out existing members from search results
    const invitableUsers = useMemo(() => {
        return searchResults.filter((user: User) => !existingMemberIds.includes(user.id));
    }, [searchResults, existingMemberIds]);

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUserIds);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUserIds(newSelected);
    };

    const handleInvite = () => {
        if (selectedUserIds.size > 0) {
            onInviteUsers?.(Array.from(selectedUserIds));
            setSelectedUserIds(new Set());
            onOpenChange(false);
        }
    };

    const handleCopyLink = () => {
        onCopyInviteLink?.();
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const showLoading = isSearching || isFetching;
    const showEmptyState = !showLoading && debouncedQuery.length >= 2 && invitableUsers.length === 0;
    const showPrompt = debouncedQuery.length < 2 && !showLoading;
    const showResults = !showLoading && debouncedQuery.length >= 2 && invitableUsers.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5"/>
                        Invite Members
                    </DialogTitle>
                    <DialogDescription>
                        Add members to {conversationName}
                    </DialogDescription>
                </DialogHeader>

                {/* Invite Link Section */}
                {conversationSlug && (
                    <div className="flex gap-2 p-3 bg-muted rounded-lg">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">Invite Link</p>
                            <p className="text-sm font-mono truncate">
                                /join/{conversationSlug}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyLink}
                            className="flex-shrink-0"
                        >
                            {linkCopied ? (
                                <>
                                    <Check className="h-4 w-4 mr-1"/>
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-1"/>
                                    Copy
                                </>
                            )}
                        </Button>
                    </div>
                )}

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search users to invite..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9"
                    />
                    {showLoading && (
                        <Loader2
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin"/>
                    )}
                </div>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    {/* Loading State */}
                    {showLoading && (
                        <div className="space-y-2 py-2">
                            {Array.from({length: 5}).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-2">
                                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0"/>
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32"/>
                                        <Skeleton className="h-3 w-20"/>
                                    </div>
                                    <Skeleton className="h-5 w-5 rounded-full flex-shrink-0"/>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Prompt to type more */}
                    {showPrompt && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Search className="h-10 w-10 mb-2 opacity-50"/>
                            <p className="text-sm">Type at least 2 characters to search</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {showEmptyState && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <UserPlus className="h-10 w-10 mb-2 opacity-50"/>
                            <p className="text-sm font-medium text-foreground mb-1">No users found</p>
                            <p className="text-xs">Try a different search term</p>
                        </div>
                    )}

                    {/* Results */}
                    {showResults && (
                        <div className="space-y-1 py-2">
                            {invitableUsers.map((user: User) => {
                                const isSelected = selectedUserIds.has(user.id);

                                return (
                                    <button
                                        key={user.id}
                                        className={cn(
                                            'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                                            isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                                        )}
                                        onClick={() => toggleUser(user.id)}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.avatarUrl || undefined} alt={user.name}/>
                                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{user.name}</p>
                                        </div>

                                        <div className={cn(
                                            'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                            isSelected
                                                ? 'bg-primary border-primary'
                                                : 'border-muted-foreground/30'
                                        )}>
                                            {isSelected && <Check className="h-3 w-3 text-primary-foreground"/>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {selectedUserIds.size > 0 && (
                    <div className="pt-4 border-t">
                        <Button className="w-full" onClick={handleInvite}>
                            <UserPlus className="h-4 w-4 mr-2"/>
                            Invite {selectedUserIds.size} {selectedUserIds.size === 1 ? 'Member' : 'Members'}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

