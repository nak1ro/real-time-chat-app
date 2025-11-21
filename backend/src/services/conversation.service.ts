import {
    Conversation,
    ConversationType as PrismaConversationType,
    MemberRole,
    Prisma,
    User,
} from '@prisma/client';
import {prisma} from '../db/prisma';
import {
    ConversationWithMembers,
    ConversationWithBasicMembers,
    CreateConversationData,
    ConversationFilters,
    UpdateConversationPatch,
} from '../domain';
import {BadRequestError, NotFoundError, AuthorizationError} from '../middleware';

// Constants

const ALLOWED_UPDATE_ROLES: MemberRole[] = [MemberRole.OWNER, MemberRole.ADMIN];

const MEMBER_INCLUDE_WITH_USER = {
    members: {
        include: {
            user: true,
        },
    },
} as const;

// Helper Functions

// Verify that a user exists by ID
const verifyUserExists = async (userId: string): Promise<User> => {
    const user = await prisma.user.findUnique({where: {id: userId}});

    if (!user) {
        throw new NotFoundError(`User with ID ${userId}`);
    }

    return user;
};

// Verify that multiple users exist
const verifyUsersExist = async (userIds: string[]): Promise<User[]> => {
    const users = await Promise.all(userIds.map(verifyUserExists));
    return users;
};

// Get conversation by ID with members and users or throw
const findConversationWithMembers = async (
    conversationId: string
): Promise<ConversationWithMembers> => {
    const conversation = await prisma.conversation.findUnique({
        where: {id: conversationId},
        include: MEMBER_INCLUDE_WITH_USER,
    });

    if (!conversation) {
        throw new NotFoundError('Conversation');
    }

    return conversation;
};

// Get conversation by ID with basic member info or throw
const findConversationWithBasicMembers = async (
    conversationId: string
): Promise<ConversationWithBasicMembers> => {
    const conversation = await prisma.conversation.findUnique({
        where: {id: conversationId},
        include: {members: true},
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
                some: {userId: userId1},
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
const verifyUserMembershipAndRole = (
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
            some: {userId},
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
                    {userId: currentUserId, role: MemberRole.MEMBER},
                    {userId: otherUserId, role: MemberRole.MEMBER},
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
        where: {id: conversationId},
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
        include: MEMBER_INCLUDE_WITH_USER,
        orderBy: {updatedAt: 'desc'},
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
    const conversation = await findConversationWithBasicMembers(conversationId);
    verifyUserMembershipAndRole(conversation, actorId, ALLOWED_UPDATE_ROLES);

    return prisma.conversation.update({
        where: {id: conversationId},
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
