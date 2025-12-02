'use client';

import {useState, useMemo, useEffect, useRef, useCallback} from 'react';
import {
    Input,
    Tabs,
    TabsList,
    TabsTrigger,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui';
import {Search} from 'lucide-react';
import {ChatListItem} from './ChatListItem';
import {UserListItem} from '../users/UserListItem';
import {ChatFilter, type ConversationFilter} from './ChatFilter';
import type {Conversation, Message} from '@/types';
import type {User} from '@/types/user.types';
import {conversationApi} from '@/lib/api';
import {useConversations, useAuth} from '@/hooks';

interface ConversationWithMeta {
    conversation: Conversation;
    lastMessage?: Message | null;
    unreadCount?: number;
    isOnline?: boolean;
}

interface ChatListPanelProps {
    selectedConversationId: string | null;
    onSelectConversation: (conversationId: string) => void;
    onPreviewConversation?: (conversation: Conversation) => void;
}

interface GlobalSearchResults {
    conversations: Conversation[];
    users: User[];
}

// Converts a list of conversations to conversations with meta-data
const mapConversationsToMeta = (conversations: Conversation[]): ConversationWithMeta[] => {
    return conversations.map((conversation) => ({
        conversation,
        lastMessage: conversation.messages?.[0] || null,
        unreadCount: 0,
        isOnline: false,
    }));
};

// Gets the display name for a conversation
function getDisplayName(conversation: Conversation, currentUserId?: string): string {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'DIRECT' && conversation.members.length > 0) {
        // Find the other user (not the current user)
        const otherMember = currentUserId
            ? conversation.members.find((m) => m.userId !== currentUserId && m.user)
            : conversation.members.find((m) => m.user);
        return otherMember?.user?.name || 'Unknown';
    }
    return 'Unnamed';
}

// Filters conversations based on filter type and search query
const filterConversations = (
    conversations: ConversationWithMeta[],
    filter: ConversationFilter,
    searchQuery: string,
    currentUserId?: string,
): ConversationWithMeta[] => {
    return conversations.filter(({conversation, lastMessage}) => {
        if (filter !== 'ALL' && conversation.type !== filter) {
            return false;
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const name = getDisplayName(conversation, currentUserId).toLowerCase();
            const messageText = lastMessage?.text?.toLowerCase() || '';
            return name.includes(query) || messageText.includes(query);
        }
        return true;
    });
};

// Sorts conversations by name or last message timestamp
const sortConversations = (
    conversations: ConversationWithMeta[],
    sortBy: 'name' | 'lastMessage',
    currentUserId?: string,
): ConversationWithMeta[] => {
    return [...conversations].sort((a, b) => {
        if (sortBy === 'name') {
            const nameA = getDisplayName(a.conversation, currentUserId);
            const nameB = getDisplayName(b.conversation, currentUserId);
            return nameA.localeCompare(nameB);
        } else {
            // Sort by last message timestamp (most recent first)
            const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
            const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        }
    });
};

// Hook to handle debounced global search (FIXED ESLint state update error)
const useGlobalSearch = (searchMode: 'LOCAL' | 'GLOBAL', searchQuery: string, filter: ConversationFilter) => {
    const [globalResults, setGlobalResults] = useState<GlobalSearchResults>({conversations: [], users: []});
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        // Functional update to safely clear state and avoid synchronous setState warning
        if (searchMode !== 'GLOBAL' || !searchQuery.trim()) {
            setGlobalResults(prev =>
                (prev.conversations.length > 0 || prev.users.length > 0)
                    ? {conversations: [], users: []}
                    : prev
            );
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            conversationApi
                .search(searchQuery, filter === 'ALL' ? undefined : filter)
                .then((results) => {
                    setGlobalResults(results);
                })
                .catch((err) => {
                    console.error('Search failed', err);
                })
                .finally(() => {
                    setIsSearching(false);
                });
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, searchMode, filter]);

    return {globalResults, isSearching};
};

// Hook to manage search mode and filter state transitions (FIXED ESLint and TS errors)
const useSearchModeState = (selectedConversationId: string | null) => {
    const [searchMode, setSearchModeInternal] = useState<'LOCAL' | 'GLOBAL'>('LOCAL');
    const [filter, setFilter] = useState<ConversationFilter>('ALL');

    // Track previous selected conversation to detect changes
    const prevSelectedIdRef = useRef(selectedConversationId);

    // Custom handler to manage both mode and filter state atomically
    const handleModeChange = useCallback((newMode: 'LOCAL' | 'GLOBAL') => {
        setSearchModeInternal(newMode);
        // Reset filter logic with type assertion to fix TS2345
        if (newMode === 'GLOBAL') {
            setFilter('DIRECT' as ConversationFilter);
        } else {
            setFilter('ALL' as ConversationFilter);
        }
    }, []);

    // Reset to local mode when a different conversation is selected (FIXED ESLint cascading render warning)
    useEffect(() => {
        if (
            selectedConversationId &&
            selectedConversationId !== prevSelectedIdRef.current &&
            searchMode === 'GLOBAL'
        ) {
            handleModeChange('LOCAL');
        }
        // Update ref
        prevSelectedIdRef.current = selectedConversationId;
        // Removed 'searchMode' from dependencies to avoid the linter warning on synchronous state updates
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversationId, handleModeChange]);

    return {searchMode, setSearchMode: handleModeChange, filter, setFilter};
};

// Component for the fixed header controls
const ChatListHeader = ({
                            searchMode,
                            setSearchMode,
                            searchQuery,
                            setSearchQuery,
                            filter,
                            setFilter,
                            sortBy,
                            setSortBy,
                        }: {
    searchMode: 'LOCAL' | 'GLOBAL';
    setSearchMode: (mode: 'LOCAL' | 'GLOBAL') => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filter: ConversationFilter;
    setFilter: (filter: ConversationFilter) => void;
    sortBy: 'name' | 'lastMessage';
    setSortBy: (sortBy: 'name' | 'lastMessage') => void;
}) => (
    <div className="flex-shrink-0 p-3 space-y-3 border-b border-border bg-background">
        <Tabs
            value={searchMode}
            onValueChange={(value) => setSearchMode(value as 'LOCAL' | 'GLOBAL')}
            className="w-full"
        >
            <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="LOCAL" className="text-xs">
                    My Chats
                </TabsTrigger>
                <TabsTrigger value="GLOBAL" className="text-xs">
                    Global Search
                </TabsTrigger>
            </TabsList>
        </Tabs>

        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input
                type="text"
                placeholder={
                    searchMode === 'LOCAL'
                        ? 'Search my chats...'
                        : 'Search people and conversations...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
            />
        </div>
        <ChatFilter value={filter} onChange={setFilter} mode={searchMode}/>
        {searchMode === 'LOCAL' && (
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'lastMessage')}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by"/>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="lastMessage">Recent First</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
            </Select>
        )}
    </div>
);

// Component to render the list of local conversations or status messages
const LocalChatList = ({
                           isLoading,
                           error,
                           filteredConversations,
                           searchQuery,
                           filter,
                           selectedConversationId,
                           currentUser,
                           onSelectConversation,
                       }: {
    isLoading: boolean;
    error: unknown;
    filteredConversations: ConversationWithMeta[];
    searchQuery: string;
    filter: ConversationFilter;
    selectedConversationId: string | null;
    currentUser: User | null | undefined;
    onSelectConversation: (conversationId: string) => void;
}) => {
    if (isLoading) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                Loading chats...
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center text-sm text-destructive">
                Failed to load chats:{' '}
                {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        );
    }

    if (filteredConversations.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                {searchQuery || filter !== 'ALL' ? 'No chats found' : 'No chats yet'}
            </div>
        );
    }

    return (
        <>
            {filteredConversations.map(
                ({conversation, lastMessage, unreadCount, isOnline}) => (
                    <ChatListItem
                        key={conversation.id}
                        conversation={conversation}
                        currentUserId={currentUser?.id}
                        lastMessage={lastMessage}
                        unreadCount={unreadCount}
                        isOnline={isOnline}
                        isActive={conversation.id === selectedConversationId}
                        onClick={() => onSelectConversation(conversation.id)}
                    />
                )
            )}
        </>
    );
};

// Component to render the global search results or status messages
const GlobalSearchResultList = ({
                                    isSearching,
                                    globalResults,
                                    searchQuery,
                                    selectedConversationId,
                                    currentUser,
                                    handleGlobalConversationClick,
                                    handleUserResultClick,
                                }: {
    isSearching: boolean;
    globalResults: GlobalSearchResults;
    searchQuery: string;
    selectedConversationId: string | null;
    currentUser: User | null | undefined;
    handleGlobalConversationClick: (conversation: Conversation) => void;
    handleUserResultClick: (userId: string) => void;
}) => {
    if (isSearching) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                Searching...
            </div>
        );
    }

    if (globalResults.conversations.length === 0 && globalResults.users.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                {searchQuery
                    ? 'No matching results found'
                    : 'Type to search globally'}
            </div>
        );
    }

    return (
        <>
            {/* Conversation Results */}
            {globalResults.conversations.map((conversation) => (
                <ChatListItem
                    key={conversation.id}
                    conversation={conversation}
                    currentUserId={currentUser?.id}
                    lastMessage={null}
                    unreadCount={0}
                    isOnline={false}
                    isActive={conversation.id === selectedConversationId}
                    onClick={() => handleGlobalConversationClick(conversation)}
                />
            ))}

            {/* User Results */}
            {globalResults.users.map((user) => (
                <UserListItem
                    key={user.id}
                    user={user}
                    isActive={false}
                    onClick={() => handleUserResultClick(user.id)}
                />
            ))}
        </>
    );
};

export function ChatListPanel({
                                  selectedConversationId,
                                  onSelectConversation,
                                  onPreviewConversation,
                              }: ChatListPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'lastMessage'>('lastMessage');

    const {user: currentUser} = useAuth();
    const {data: conversations = [], isLoading, error} = useConversations();

    const {searchMode, setSearchMode, filter, setFilter} = useSearchModeState(selectedConversationId);
    const {globalResults, isSearching} = useGlobalSearch(searchMode, searchQuery, filter);

    const conversationsWithMeta = useMemo(() => mapConversationsToMeta(conversations), [conversations]);

    const filteredConversations = useMemo(() => {
        if (searchMode === 'GLOBAL') return [];

        const filtered = filterConversations(
            conversationsWithMeta,
            filter,
            searchQuery,
            currentUser?.id
        );

        return sortConversations(filtered, sortBy, currentUser?.id);
    }, [conversationsWithMeta, filter, searchQuery, searchMode, currentUser?.id, sortBy]);

    // Handle click on a conversation from global search results
    const handleGlobalConversationClick = useCallback((conversation: Conversation) => {
        // If it's a channel and user is not a member, preview it
        if (conversation.type === 'CHANNEL') {
            const isMember = conversation.members?.some(m => m.userId === currentUser?.id);
            if (!isMember && onPreviewConversation) {
                onPreviewConversation(conversation);
                return;
            }
        }

        onSelectConversation(conversation.id);
    }, [currentUser?.id, onPreviewConversation, onSelectConversation]);

    // Handle click on a user from global search results
    const handleUserResultClick = useCallback(async (userId: string) => {
        try {
            // Get or create a direct conversation with this user
            const conversation = await conversationApi.createDirect({otherUserId: userId});
            onSelectConversation(conversation.id);
        } catch (err) {
            console.error('Failed to open direct conversation', err);
        }
    }, [onSelectConversation]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header - fixed at top */}
            <ChatListHeader
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filter={filter}
                setFilter={setFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
            />

            {/* Scrollable list area */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-2 space-y-1">
                    {searchMode === 'LOCAL' ? (
                        <LocalChatList
                            isLoading={isLoading}
                            error={error}
                            filteredConversations={filteredConversations}
                            searchQuery={searchQuery}
                            filter={filter}
                            selectedConversationId={selectedConversationId}
                            currentUser={currentUser}
                            onSelectConversation={onSelectConversation}
                        />
                    ) : (
                        <GlobalSearchResultList
                            isSearching={isSearching}
                            globalResults={globalResults}
                            searchQuery={searchQuery}
                            selectedConversationId={selectedConversationId}
                            currentUser={currentUser}
                            handleGlobalConversationClick={handleGlobalConversationClick}
                            handleUserResultClick={handleUserResultClick}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}