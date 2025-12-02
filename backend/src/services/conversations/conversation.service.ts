import {
    Conversation,
    ConversationType as PrismaConversationType,
    MemberRole,
    Prisma,
    User,
} from '@prisma/client';
import { prisma } from '../../db/prisma';
import {
    ConversationWithMembers,
    ConversationWithBasicMembers,
    CreateConversationData,
    ConversationFilters,
    UpdateConversationPatch,
} from '../../domain';
import { BadRequestError, NotFoundError, AuthorizationError } from '../../middleware';
import { canManageMembers } from '../users/permissions.service';
import { MEMBER_INCLUDE_WITH_USER } from '../shared/service-constants';
import { verifyUserExists, verifyUsersExist } from '../../utils/validation-helpers';

// Constants

const ALLOWED_UPDATE_ROLES: MemberRole[] = [MemberRole.OWNER, MemberRole.ADMIN];
const ALLOWED_ADD_MEMBER_ROLES: MemberRole[] = [MemberRole.OWNER, MemberRole.ADMIN];
const ALLOWED_REMOVE_MEMBER_ROLES: MemberRole[] = [MemberRole.OWNER, MemberRole.ADMIN];
const ALLOWED_UPDATE_ROLE_ROLES: MemberRole[] = [MemberRole.OWNER, MemberRole.ADMIN];

// Role hierarchy (higher number = higher authority)
const ROLE_HIERARCHY: Record<MemberRole, number> = {
    [MemberRole.OWNER]: 3,
    [MemberRole.ADMIN]: 2,
    [MemberRole.MEMBER]: 0,
};



// Helper Functions



// Get conversation by ID with members and users or throw
const findConversationWithMembers = async (
    conversationId: string
): Promise<ConversationWithMembers> => {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: MEMBER_INCLUDE_WITH_USER,
    });

    if (!conversation) {
        throw new NotFoundError('Conversation');
    }

    return conversation;
};

// Get conversation by ID with basic member info or throw
export const findConversationWithBasicMembers = async (
    conversationId: string
): Promise<ConversationWithBasicMembers> => {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { members: true },
    });

    if (!conversation) {
        throw new NotFoundError('Conversation');
    }

    return conversation;
};

// Find existing direct conversation between two users
const findExistingDirectConversation = async (
    userId1: string,
    userId2: string
): Promise<ConversationWithMembers | null> => {
    const conversations = await prisma.conversation.findMany({
        where: {
            type: PrismaConversationType.DIRECT,
            members: {
                some: { userId: userId1 },
            },
        },
        include: MEMBER_INCLUDE_WITH_USER,
    });

    return (
        conversations.find((conv) => {
            const memberIds = conv.members.map((m) => m.userId);
            return (
                memberIds.length === 2 &&
                memberIds.includes(userId1) &&
                memberIds.includes(userId2)
            );
        }) ?? null
    );
};

// Find a user's membership in a conversation
const findUserMembership = (
    conversation: ConversationWithBasicMembers,
    userId: string
) => {
    return conversation.members.find((member) => member.userId === userId);
};

// Ensure user is a member of conversation or throw
const verifyUserIsMember = (
    conversation: ConversationWithBasicMembers,
    userId: string
): void => {
    const isMember = conversation.members.some((member) => member.userId === userId);

    if (!isMember) {
        throw new AuthorizationError('You are not a member of this conversation');
    }
};

// Ensure member has one of the allowed roles or throw
const verifyMemberHasRole = (
    memberRole: MemberRole,
    allowedRoles: MemberRole[],
    errorMessage: string
): void => {
    if (!allowedRoles.includes(memberRole)) {
        throw new AuthorizationError(errorMessage);
    }
};

// Ensure user is a member with one of the allowed roles or throw
export const verifyUserMembershipAndRole = (
    conversation: ConversationWithBasicMembers,
    userId: string,
    allowedRoles: MemberRole[]
): void => {
    const membership = findUserMembership(conversation, userId);

    if (!membership) {
        throw new AuthorizationError('You are not a member of this conversation');
    }

    verifyMemberHasRole(
        membership.role,
        allowedRoles,
        `Only ${allowedRoles.join(' or ')} can perform this action`
    );
};

// Build Prisma where clause for conversation filters
const buildConversationWhereClause = (
    userId: string,
    filters?: ConversationFilters
): Prisma.ConversationWhereInput => {
    const where: Prisma.ConversationWhereInput = {
        members: {
            some: { userId },
        },
    };

    if (filters?.type) {
        where.type = PrismaConversationType[filters.type];
    }

    if (filters?.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
    }

    if (filters?.name) {
        where.name = {
            contains: filters.name,
            mode: 'insensitive',
        };
    }

    return where;
};

// Check if users are already members of a conversation
const filterExistingMembers = (
    conversation: ConversationWithBasicMembers,
    userIds: string[]
): { newUserIds: string[]; existingUserIds: string[] } => {
    const existingMemberIds = new Set(conversation.members.map((m) => m.userId));
    const newUserIds: string[] = [];
    const existingUserIds: string[] = [];

    for (const userId of userIds) {
        if (existingMemberIds.has(userId)) {
            existingUserIds.push(userId);
        } else {
            newUserIds.push(userId);
        }
    }

    return { newUserIds, existingUserIds };
};

// Check if removing a member would leave the conversation without an OWNER
const wouldRemoveLastOwner = (
    conversation: ConversationWithBasicMembers,
    memberIdToRemove: string
): boolean => {
    const memberToRemove = conversation.members.find((m) => m.userId === memberIdToRemove);

    if (!memberToRemove || memberToRemove.role !== MemberRole.OWNER) {
        return false;
    }

    const ownerCount = conversation.members.filter((m) => m.role === MemberRole.OWNER).length;
    return ownerCount === 1;
};

// Check if changing a role would leave the conversation without an OWNER
const wouldRemoveLastOwnerByRoleChange = (
    conversation: ConversationWithBasicMembers,
    memberId: string,
    newRole: MemberRole
): boolean => {
    const memberToChange = conversation.members.find((m) => m.userId === memberId);

    if (!memberToChange || memberToChange.role !== MemberRole.OWNER || newRole === MemberRole.OWNER) {
        return false;
    }

    const ownerCount = conversation.members.filter((m) => m.role === MemberRole.OWNER).length;
    return ownerCount === 1;
};

// Compare role hierarchy levels
const getRoleLevel = (role: MemberRole): number => {
    return ROLE_HIERARCHY[role];
};

// Check if actor has higher role than target
const hasHigherRole = (actorRole: MemberRole, targetRole: MemberRole): boolean => {
    return getRoleLevel(actorRole) > getRoleLevel(targetRole);
};

// Public API

// Create or get existing direct conversation between two users
export const createDirectConversation = async (
    currentUserId: string,
    otherUserId: string
): Promise<ConversationWithMembers> => {
    if (currentUserId === otherUserId) {
        throw new BadRequestError('Cannot create a direct conversation with yourself');
    }

    const [currentUser, otherUser] = await verifyUsersExist([currentUserId, otherUserId]);

    const existingConversation = await findExistingDirectConversation(
        currentUserId,
        otherUserId
    );

    if (existingConversation) {
        return existingConversation;
    }

    return prisma.conversation.create({
        data: {
            name: `${currentUser.name}, ${otherUser.name}`,
            type: PrismaConversationType.DIRECT,
            createdById: currentUserId,
            members: {
                create: [
                    { userId: currentUserId, role: MemberRole.MEMBER },
                    { userId: otherUserId, role: MemberRole.MEMBER },
                ],
            },
        },
        include: MEMBER_INCLUDE_WITH_USER,
    });
};

// Create a group or channel conversation
export const createGroupOrChannelConversation = async (
    currentUserId: string,
    data: CreateConversationData
): Promise<ConversationWithMembers> => {
    if (data.type !== 'GROUP' && data.type !== 'CHANNEL') {
        throw new BadRequestError('Conversation type must be GROUP or CHANNEL');
    }

    await verifyUserExists(currentUserId);

    return prisma.conversation.create({
        data: {
            name: data.name,
            type: PrismaConversationType[data.type],
            description: data.description,
            slug: data.slug,
            isPublic: data.isPublic ?? false,
            isReadOnly: data.isReadOnly ?? false,
            avatarUrl: data.avatarUrl,
            createdById: currentUserId,
            members: {
                create: {
                    userId: currentUserId,
                    role: MemberRole.OWNER,
                },
            },
        },
        include: MEMBER_INCLUDE_WITH_USER,
    });
};

// Find conversation by ID (optionally with members)
export const findConversationById = async (
    conversationId: string,
    includeMembers: boolean = false
): Promise<Conversation | ConversationWithMembers | null> => {
    return prisma.conversation.findUnique({
        where: { id: conversationId },
        include: includeMembers ? MEMBER_INCLUDE_WITH_USER : undefined,
    });
};

// List all conversations for a user with optional filters
export const listUserConversations = async (
    userId: string,
    filters?: ConversationFilters
): Promise<ConversationWithMembers[]> => {
    const where = buildConversationWhereClause(userId, filters);

    return prisma.conversation.findMany({
        where,
        include: {
            ...MEMBER_INCLUDE_WITH_USER,
            messages: {
                take: 1,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });
};

// Get a specific conversation by ID for a user
export const getConversationByIdForUser = async (
    conversationId: string,
    userId: string
): Promise<ConversationWithMembers> => {
    const conversation = await findConversationWithMembers(conversationId);
    verifyUserIsMember(conversation, userId);
    return conversation;
};

// Update a conversation (OWNER or ADMIN only)
export const updateConversation = async (
    conversationId: string,
    actorId: string,
    patch: UpdateConversationPatch
): Promise<ConversationWithMembers> => {
    // Verify actor has permission to update conversation
    const canManage = await canManageMembers(actorId, conversationId);
    if (!canManage) {
        throw new AuthorizationError('Only OWNER or ADMIN can update conversations');
    }

    return prisma.conversation.update({
        where: { id: conversationId },
        data: {
            name: patch.name,
            description: patch.description,
            avatarUrl: patch.avatarUrl,
            isPublic: patch.isPublic,
            isReadOnly: patch.isReadOnly,
        },
        include: MEMBER_INCLUDE_WITH_USER,
    });
};

// Add members to a conversation (OWNER or ADMIN only)
export const addConversationMembers = async (
    conversationId: string,
    actorId: string,
    userIds: string[],
    role: MemberRole = MemberRole.MEMBER
): Promise<ConversationWithMembers> => {
    if (!userIds.length) {
        throw new BadRequestError('At least one user ID must be provided');
    }

    // Remove duplicates from input
    const uniqueUserIds = [...new Set(userIds)];

    // Verify actor has permission to add members
    const canManage = await canManageMembers(actorId, conversationId);
    if (!canManage) {
        throw new AuthorizationError('Only OWNER or ADMIN can add members');
    }

    // Get conversation
    const conversation = await findConversationWithBasicMembers(conversationId);

    // Cannot add members to direct conversations
    if (conversation.type === PrismaConversationType.DIRECT) {
        throw new BadRequestError('Cannot add members to direct conversations');
    }

    // Filter out users who are already members
    const { newUserIds, existingUserIds } = filterExistingMembers(
        conversation,
        uniqueUserIds
    );

    if (newUserIds.length === 0) {
        if (existingUserIds.length > 0) {
            throw new BadRequestError('All specified users are already members');
        }
        throw new BadRequestError('No valid users to add');
    }

    // Verify all new users exist
    await verifyUsersExist(newUserIds);

    // Add members using a transaction
    await prisma.$transaction(
        newUserIds.map((userId) =>
            prisma.conversationMember.create({
                data: {
                    conversationId,
                    userId,
                    role,
                },
            })
        )
    );

    // Return updated conversation with members
    return findConversationWithMembers(conversationId);
};

// Remove a member from a conversation (OWNER or ADMIN only)
export const removeConversationMember = async (
    conversationId: string,
    actorId: string,
    memberId: string
): Promise<ConversationWithMembers> => {
    if (!memberId) {
        throw new BadRequestError('Member ID must be provided');
    }

    if (actorId === memberId) {
        throw new BadRequestError('Cannot remove yourself. Use leaveConversation instead');
    }

    // Verify actor has permission to remove members
    const canManage = await canManageMembers(actorId, conversationId);
    if (!canManage) {
        throw new AuthorizationError('Only OWNER or ADMIN can remove members');
    }

    // Get conversation
    const conversation = await findConversationWithBasicMembers(conversationId);

    // Cannot remove members from direct conversations
    if (conversation.type === PrismaConversationType.DIRECT) {
        throw new BadRequestError('Cannot remove members from direct conversations');
    }

    // Check if member exists in conversation
    const memberToRemove = findUserMembership(conversation, memberId);
    if (!memberToRemove) {
        throw new NotFoundError('Member not found in this conversation');
    }

    // Prevent removing the last OWNER
    if (wouldRemoveLastOwner(conversation, memberId)) {
        throw new BadRequestError(
            'Cannot remove the last OWNER. Transfer ownership first or add another OWNER'
        );
    }

    // Remove the member
    await prisma.conversationMember.delete({
        where: {
            id: memberToRemove.id,
        },
    });

    // Return updated conversation with members
    return findConversationWithMembers(conversationId);
};

// Leave a conversation
export const leaveConversation = async (
    conversationId: string,
    userId: string
): Promise<void> => {
    // Get conversation and verify membership
    const conversation = await findConversationWithBasicMembers(conversationId);
    const membership = findUserMembership(conversation, userId);

    if (!membership) {
        throw new NotFoundError('You are not a member of this conversation');
    }

    // Cannot leave direct conversations
    if (conversation.type === PrismaConversationType.DIRECT) {
        throw new BadRequestError('Cannot leave direct conversations');
    }

    // Prevent last OWNER from leaving
    if (wouldRemoveLastOwner(conversation, userId)) {
        throw new BadRequestError(
            'Cannot leave as the last OWNER. Transfer ownership first or add another OWNER'
        );
    }

    // Remove the membership
    await prisma.conversationMember.delete({
        where: {
            id: membership.id,
        },
    });
};

// Update a member's role (OWNER or ADMIN only, with hierarchy enforcement)
export const updateMemberRole = async (
    conversationId: string,
    actorId: string,
    memberId: string,
    newRole: MemberRole
): Promise<ConversationWithMembers> => {
    if (!memberId) {
        throw new BadRequestError('Member ID must be provided');
    }

    if (actorId === memberId) {
        throw new BadRequestError('Cannot change your own role');
    }

    // Validate new role is allowed
    if (
        newRole !== MemberRole.OWNER &&
        newRole !== MemberRole.ADMIN &&
        newRole !== MemberRole.MEMBER
    ) {
        throw new BadRequestError('Invalid role. Allowed roles: OWNER, ADMIN, MEMBER');
    }

    // Verify actor has permission to update member roles
    const canManage = await canManageMembers(actorId, conversationId);
    if (!canManage) {
        throw new AuthorizationError('Only OWNER or ADMIN can update member roles');
    }

    const conversation = await findConversationWithBasicMembers(conversationId);

    // Cannot change roles in direct conversations
    if (conversation.type === PrismaConversationType.DIRECT) {
        throw new BadRequestError('Cannot change roles in direct conversations');
    }

    // Get actor and target member
    const actorMember = findUserMembership(conversation, actorId);
    const targetMember = findUserMembership(conversation, memberId);

    if (!actorMember) {
        throw new AuthorizationError('You are not a member of this conversation');
    }

    if (!targetMember) {
        throw new NotFoundError('Target member not found in this conversation');
    }

    // Check if target member already has the new role
    if (targetMember.role === newRole) {
        throw new BadRequestError(`Member already has the role ${newRole}`);
    }

    // Enforce hierarchy: actor must have higher role than target
    if (!hasHigherRole(actorMember.role, targetMember.role)) {
        throw new AuthorizationError(
            'You can only change roles of members with lower roles than yours'
        );
    }

    // Prevent promoting someone to a role equal or higher than actor's own role
    if (getRoleLevel(newRole) >= getRoleLevel(actorMember.role)) {
        throw new AuthorizationError('You cannot promote someone to your role or higher');
    }

    // Prevent demoting the last OWNER
    if (wouldRemoveLastOwnerByRoleChange(conversation, memberId, newRole)) {
        throw new BadRequestError(
            'Cannot demote the last OWNER. Promote another member to OWNER first'
        );
    }

    // Update the member's role
    await prisma.conversationMember.update({
        where: {
            id: targetMember.id,
        },
        data: {
            role: newRole,
        },
    });

    // Return updated conversation with members
    return findConversationWithMembers(conversationId);
};

// List all public channels
export const listPublicChannels = async (filters?: ConversationFilters) => {
    const where: Prisma.ConversationWhereInput = {
        type: PrismaConversationType.CHANNEL,
        isPublic: true,
    };

    // Apply optional name filter
    if (filters?.name) {
        where.name = {
            contains: filters.name,
            mode: 'insensitive',
        };
    }

    const channels = await prisma.conversation.findMany({
        where,
        orderBy: [
            { createdAt: 'desc' },
        ],
        include: {
            _count: {
                select: {
                    members: true,
                },
            },
        },
    });

    return channels;
};

// Join a public channel by slug
export const joinChannelBySlug = async (slug: string, userId: string) => {
    // Find channel by slug
    const channel = await prisma.conversation.findUnique({
        where: { slug },
        include: {
            members: true,
        },
    });

    if (!channel) {
        throw new NotFoundError('Channel');
    }

    // Verify it's a public channel
    if (!channel.isPublic || channel.type !== PrismaConversationType.CHANNEL) {
        throw new BadRequestError('This is not a public channel');
    }

    // Check if user is already a member
    const existingMember = channel.members.find((m) => m.userId === userId);
    if (existingMember) {
        throw new BadRequestError('You are already a member of this channel');
    }

    // Check for active ban
    const now = new Date();
    const activeBan = await prisma.channelBan.findUnique({
        where: {
            userId_conversationId: {
                userId,
                conversationId: channel.id,
            },
        },
    });

    if (activeBan && (!activeBan.expiresAt || activeBan.expiresAt > now)) {
        const message = activeBan.expiresAt
            ? `You are banned from this channel until ${activeBan.expiresAt.toISOString()}`
            : 'You are permanently banned from this channel';
        throw new AuthorizationError(message);
    }

    // Add user as member
    await prisma.conversationMember.create({
        data: {
            userId,
            conversationId: channel.id,
            role: MemberRole.MEMBER,
        },
    });

    // Return updated channel with members
    return findConversationWithMembers(channel.id);
};

// Generate unique slug from channel name
export const generateSlug = async (name: string): Promise<string> => {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // Check if slug exists
    const existing = await prisma.conversation.findUnique({
        where: { slug: baseSlug },
    });

    if (!existing) {
        return baseSlug;
    }

    // If exists, append number
    let counter = 1;
    let slug = `${baseSlug}-${counter}`;

    while (await prisma.conversation.findUnique({ where: { slug } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
    }

    return slug;
};



// Search conversations and users
export const searchConversations = async (
    query: string,
    currentUserId: string,
    type?: string
) => {
    const searchQuery = query.trim();
    if (!searchQuery) {
        return { conversations: [], users: [] };
    }

    const conversationWhere: Prisma.ConversationWhereInput = {
        OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
    };

    let searchUsers = false;

    // Apply filters based on type
    if (type === 'DIRECT') {
        // Direct messages: Only existing DMs where user is a member
        conversationWhere.type = PrismaConversationType.DIRECT;
        conversationWhere.members = {
            some: { userId: currentUserId },
        };
        // Do not search for new users in "Direct" filter, only existing convos
        searchUsers = false;
    } else if (type === 'GROUP') {
        // Groups: Public groups OR private groups where user is a member
        conversationWhere.type = PrismaConversationType.GROUP;
        conversationWhere.AND = [
            {
                OR: [
                    { isPublic: true },
                    { members: { some: { userId: currentUserId } } },
                ],
            },
        ];
        searchUsers = false;
    } else if (type === 'CHANNEL') {
        // Channels: Public channels OR private channels where user is a member
        conversationWhere.type = PrismaConversationType.CHANNEL;
        conversationWhere.AND = [
            {
                OR: [
                    { isPublic: true },
                    { members: { some: { userId: currentUserId } } },
                ],
            },
        ];
        searchUsers = false;
    } else {
        // All (Default): Public convos OR any convo where user is a member
        conversationWhere.AND = [
            {
                OR: [
                    { isPublic: true },
                    { members: { some: { userId: currentUserId } } },
                ],
            },
        ];
        searchUsers = true;
    }

    const conversations = await prisma.conversation.findMany({
        where: conversationWhere,
        orderBy: {
            updatedAt: 'desc',
        },
        take: 20,
    });

    let users: User[] = [];
    if (searchUsers) {
        users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                OR: [
                    { name: { contains: searchQuery, mode: 'insensitive' } },
                ],
            },
            orderBy: {
                name: 'asc',
            },
            take: 20,
        });
    }

    return { conversations, users };
};

// Get attachments for a conversation with pagination
export const getConversationAttachments = async (
    conversationId: string,
    userId: string,
    type?: string,
    pagination?: { cursor?: string; limit?: number }
) => {
    // Verify membership
    const conversation = await findConversationWithBasicMembers(conversationId);
    verifyUserIsMember(conversation, userId);

    const limit = Math.min(pagination?.limit || 20, 50);
    const cursor = pagination?.cursor;

    const where: Prisma.AttachmentWhereInput = {
        message: {
            conversationId,
            deletedAt: null, // Don't show attachments from deleted messages
        },
    };

    if (type) {
        where.type = type as any;
    }

    const attachments = await prisma.attachment.findMany({
        where,
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            message: {
                select: {
                    id: true,
                    createdAt: true,
                    userId: true,
                },
            },
        },
    });

    const hasMore = attachments.length > limit;
    const returnAttachments = hasMore ? attachments.slice(0, limit) : attachments;
    const nextCursor =
        hasMore && returnAttachments.length > 0
            ? returnAttachments[returnAttachments.length - 1].id
            : null;

    return {
        attachments: returnAttachments,
        nextCursor,
        hasMore,
    };
};

// Delete a conversation (Direct: any member, Group/Channel: OWNER only)
export const deleteConversation = async (
    conversationId: string,
    actorId: string
): Promise<void> => {
    const conversation = await findConversationWithBasicMembers(conversationId);

    // Check if user is a member
    const membership = findUserMembership(conversation, actorId);
    if (!membership) {
        throw new NotFoundError('You are not a member of this conversation');
    }

    // Logic based on conversation type
    if (conversation.type === PrismaConversationType.DIRECT) {
        // For Direct conversations, any member can delete it (as per user request)
        // This deletes it for BOTH sides
    } else {
        // For Group/Channel, only OWNER can delete
        if (membership.role !== MemberRole.OWNER) {
            throw new AuthorizationError('Only OWNER can delete this conversation');
        }
    }

    await prisma.conversation.delete({
        where: { id: conversationId },
    });
};
