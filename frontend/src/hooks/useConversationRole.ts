import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useConversation } from './useConversations';
import { MemberRole } from '@/types';

export interface UseConversationRoleResult {
    /** The user's role in the conversation (MEMBER, ADMIN, etc.) */
    role: MemberRole | null;
    /** Whether the user is the conversation creator/owner */
    isOwner: boolean;
    /** Whether the user has the ADMIN role */
    isAdmin: boolean;
    /** Whether the user has elevated privileges (Admin OR Owner) */
    isElevated: boolean;
    /** Whether the user is a member of the conversation */
    isMember: boolean;
    /** Whether the role data is still loading */
    isLoading: boolean;
}

export function useConversationRole(conversationId: string | undefined): UseConversationRoleResult {
    const { user } = useAuth();
    const { data: conversation, isLoading } = useConversation(conversationId);

    const roleInfo = useMemo(() => {
        if (!conversation || !user || !conversationId) {
            return {
                role: null,
                isOwner: false,
                isAdmin: false,
                isElevated: false,
                isMember: false,
            };
        }

        const member = conversation.members?.find((m) => m.userId === user.id);
        const role = member?.role || null;
        
        // Owner is determined by createdById field
        const isOwner = conversation.createdById === user.id;
        const isAdmin = role === MemberRole.ADMIN;
        
        return {
            role,
            isOwner,
            isAdmin,
            isElevated: isOwner || isAdmin,
            isMember: !!member,
        };
    }, [conversation, user, conversationId]);

    return {
        ...roleInfo,
        isLoading,
    };
}
