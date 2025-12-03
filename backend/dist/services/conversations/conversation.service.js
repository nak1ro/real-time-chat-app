"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.getConversationAttachments = exports.searchConversations = exports.generateSlug = exports.joinChannelBySlug = exports.listPublicChannels = exports.updateMemberRole = exports.leaveConversation = exports.removeConversationMember = exports.addConversationMembers = exports.updateConversation = exports.getConversationByIdForUser = exports.listUserConversations = exports.createGroupOrChannelConversation = exports.createDirectConversation = exports.verifyUserMembershipAndRole = exports.findConversationWithBasicMembers = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
const permissions_service_1 = require("../users/permissions.service");
const service_constants_1 = require("../shared/service-constants");
const validation_helpers_1 = require("../../utils/validation-helpers");
// Role hierarchy (higher number = higher authority)
const ROLE_HIERARCHY = {
    [client_1.MemberRole.OWNER]: 3,
    [client_1.MemberRole.ADMIN]: 2,
    [client_1.MemberRole.MEMBER]: 0,
};
// Roles allowed for management operations
// Get conversation by ID with members and users or throw
const findConversationWithMembers = async (conversationId) => {
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: service_constants_1.MEMBER_INCLUDE_WITH_USER,
    });
    if (!conversation) {
        throw new middleware_1.NotFoundError('Conversation');
    }
    return conversation;
};
// Get conversation by ID with basic member info or throw
const findConversationWithBasicMembers = async (conversationId) => {
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { members: true },
    });
    if (!conversation) {
        throw new middleware_1.NotFoundError('Conversation');
    }
    return conversation;
};
exports.findConversationWithBasicMembers = findConversationWithBasicMembers;
// Find existing direct conversation between two users
const findExistingDirectConversation = async (userId1, userId2) => {
    const conversations = await prisma_1.prisma.conversation.findMany({
        where: {
            type: client_1.ConversationType.DIRECT,
            members: {
                some: { userId: userId1 },
            },
        },
        include: service_constants_1.MEMBER_INCLUDE_WITH_USER,
    });
    return (conversations.find((conv) => {
        const memberIds = conv.members.map((m) => m.userId);
        return (memberIds.length === 2 &&
            memberIds.includes(userId1) &&
            memberIds.includes(userId2));
    }) ?? null);
};
// Find a user's membership in a conversation
const findUserMembership = (conversation, userId) => {
    return conversation.members.find((member) => member.userId === userId);
};
// Check if user is a member of conversation
const isUserMember = (conversation, userId) => {
    return conversation.members.some((member) => member.userId === userId);
};
// Ensure user is a member of conversation or throw
const verifyUserIsMember = (conversation, userId) => {
    if (!isUserMember(conversation, userId)) {
        throw new middleware_1.AuthorizationError('You are not a member of this conversation');
    }
};
// Ensure member has one of the allowed roles or throw
const verifyMemberHasRole = (memberRole, allowedRoles, errorMessage) => {
    if (!allowedRoles.includes(memberRole)) {
        throw new middleware_1.AuthorizationError(errorMessage);
    }
};
// Ensure user is a member with one of the allowed roles or throw
const verifyUserMembershipAndRole = (conversation, userId, allowedRoles) => {
    const membership = findUserMembership(conversation, userId);
    if (!membership) {
        throw new middleware_1.AuthorizationError('You are not a member of this conversation');
    }
    verifyMemberHasRole(membership.role, allowedRoles, `Only ${allowedRoles.join(' or ')} can perform this action`);
};
exports.verifyUserMembershipAndRole = verifyUserMembershipAndRole;
// Build Prisma where clause for conversation filters
const buildConversationWhereClause = (userId, filters) => {
    const where = {
        members: {
            some: { userId },
        },
    };
    if (filters?.type) {
        where.type = client_1.ConversationType[filters.type];
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
const filterExistingMembers = (conversation, userIds) => {
    const existingMemberIds = new Set(conversation.members.map((m) => m.userId));
    const newUserIds = [];
    const existingUserIds = [];
    for (const userId of userIds) {
        if (existingMemberIds.has(userId)) {
            existingUserIds.push(userId);
        }
        else {
            newUserIds.push(userId);
        }
    }
    return { newUserIds, existingUserIds };
};
// Get role hierarchy level
const getRoleLevel = (role) => ROLE_HIERARCHY[role];
// Check if actor has higher role than target
const hasHigherRole = (actorRole, targetRole) => {
    return getRoleLevel(actorRole) > getRoleLevel(targetRole);
};
// Check if removing member would leave conversation without an OWNER
const wouldRemoveLastOwner = (conversation, memberIdToRemove) => {
    const memberToRemove = conversation.members.find((m) => m.userId === memberIdToRemove);
    if (!memberToRemove || memberToRemove.role !== client_1.MemberRole.OWNER) {
        return false;
    }
    const ownerCount = conversation.members.filter((m) => m.role === client_1.MemberRole.OWNER).length;
    return ownerCount === 1;
};
// Check if changing role would leave conversation without an OWNER
const wouldRemoveLastOwnerByRoleChange = (conversation, memberId, newRole) => {
    const memberToChange = conversation.members.find((m) => m.userId === memberId);
    if (!memberToChange || memberToChange.role !== client_1.MemberRole.OWNER || newRole === client_1.MemberRole.OWNER) {
        return false;
    }
    const ownerCount = conversation.members.filter((m) => m.role === client_1.MemberRole.OWNER).length;
    return ownerCount === 1;
};
// Create or get existing direct conversation between two users
const createDirectConversation = async (currentUserId, otherUserId) => {
    if (currentUserId === otherUserId) {
        throw new middleware_1.BadRequestError('Cannot create a direct conversation with yourself');
    }
    const [currentUser, otherUser] = await (0, validation_helpers_1.verifyUsersExist)([currentUserId, otherUserId]);
    const existingConversation = await findExistingDirectConversation(currentUserId, otherUserId);
    if (existingConversation) {
        return existingConversation;
    }
    return prisma_1.prisma.conversation.create({
        data: {
            name: `${currentUser.name}, ${otherUser.name}`,
            type: client_1.ConversationType.DIRECT,
            createdById: currentUserId,
            members: {
                create: [
                    { userId: currentUserId, role: client_1.MemberRole.MEMBER },
                    { userId: otherUserId, role: client_1.MemberRole.MEMBER },
                ],
            },
        },
        include: service_constants_1.MEMBER_INCLUDE_WITH_USER,
    });
};
exports.createDirectConversation = createDirectConversation;
// Create a group or channel conversation
const createGroupOrChannelConversation = async (currentUserId, data) => {
    if (data.type !== 'GROUP' && data.type !== 'CHANNEL') {
        throw new middleware_1.BadRequestError('Conversation type must be GROUP or CHANNEL');
    }
    await (0, validation_helpers_1.verifyUserExists)(currentUserId);
    return prisma_1.prisma.conversation.create({
        data: {
            name: data.name,
            type: client_1.ConversationType[data.type],
            description: data.description,
            slug: data.slug,
            isPublic: data.isPublic ?? false,
            isReadOnly: data.isReadOnly ?? false,
            avatarUrl: data.avatarUrl,
            createdById: currentUserId,
            members: {
                create: {
                    userId: currentUserId,
                    role: client_1.MemberRole.OWNER,
                },
            },
        },
        include: service_constants_1.MEMBER_INCLUDE_WITH_USER,
    });
};
exports.createGroupOrChannelConversation = createGroupOrChannelConversation;
// List all conversations for a user with optional filters
const listUserConversations = async (userId, filters) => {
    const where = buildConversationWhereClause(userId, filters);
    return prisma_1.prisma.conversation.findMany({
        where,
        include: {
            ...service_constants_1.MEMBER_INCLUDE_WITH_USER,
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
exports.listUserConversations = listUserConversations;
// Get a specific conversation by ID for a user
const getConversationByIdForUser = async (conversationId, userId) => {
    const conversation = await findConversationWithMembers(conversationId);
    verifyUserIsMember(conversation, userId);
    return conversation;
};
exports.getConversationByIdForUser = getConversationByIdForUser;
// Update a conversation (OWNER or ADMIN only)
const updateConversation = async (conversationId, actorId, patch) => {
    const canManage = await (0, permissions_service_1.canManageMembers)(actorId, conversationId);
    if (!canManage) {
        throw new middleware_1.AuthorizationError('Only OWNER or ADMIN can update conversations');
    }
    return prisma_1.prisma.conversation.update({
        where: { id: conversationId },
        data: {
            name: patch.name,
            description: patch.description,
            avatarUrl: patch.avatarUrl,
            isPublic: patch.isPublic,
            isReadOnly: patch.isReadOnly,
        },
        include: service_constants_1.MEMBER_INCLUDE_WITH_USER,
    });
};
exports.updateConversation = updateConversation;
// Validate user IDs are not empty
const validateUserIds = (userIds) => {
    if (!userIds.length) {
        throw new middleware_1.BadRequestError('At least one user ID must be provided');
    }
};
// Validate member ID
const validateMemberId = (memberId) => {
    if (!memberId) {
        throw new middleware_1.BadRequestError('Member ID must be provided');
    }
};
// Prevent direct conversation member operations
const preventDirectConversationModification = (conversationType) => {
    if (conversationType === client_1.ConversationType.DIRECT) {
        throw new middleware_1.BadRequestError('Cannot modify members in direct conversations');
    }
};
// Add members to a conversation (OWNER or ADMIN only)
const addConversationMembers = async (conversationId, actorId, userIds, role = client_1.MemberRole.MEMBER) => {
    validateUserIds(userIds);
    const uniqueUserIds = [...new Set(userIds)];
    const canManage = await (0, permissions_service_1.canManageMembers)(actorId, conversationId);
    if (!canManage) {
        throw new middleware_1.AuthorizationError('Only OWNER or ADMIN can add members');
    }
    const conversation = await (0, exports.findConversationWithBasicMembers)(conversationId);
    preventDirectConversationModification(conversation.type);
    const { newUserIds } = filterExistingMembers(conversation, uniqueUserIds);
    if (newUserIds.length === 0) {
        throw new middleware_1.BadRequestError('All specified users are already members');
    }
    await (0, validation_helpers_1.verifyUsersExist)(newUserIds);
    await prisma_1.prisma.$transaction(newUserIds.map((userId) => prisma_1.prisma.conversationMember.create({
        data: {
            conversationId,
            userId,
            role,
        },
    })));
    return findConversationWithMembers(conversationId);
};
exports.addConversationMembers = addConversationMembers;
// Remove a member from a conversation (OWNER or ADMIN only)
const removeConversationMember = async (conversationId, actorId, memberId) => {
    validateMemberId(memberId);
    if (actorId === memberId) {
        throw new middleware_1.BadRequestError('Cannot remove yourself. Use leaveConversation instead');
    }
    const canManage = await (0, permissions_service_1.canManageMembers)(actorId, conversationId);
    if (!canManage) {
        throw new middleware_1.AuthorizationError('Only OWNER or ADMIN can remove members');
    }
    const conversation = await (0, exports.findConversationWithBasicMembers)(conversationId);
    preventDirectConversationModification(conversation.type);
    const memberToRemove = findUserMembership(conversation, memberId);
    if (!memberToRemove) {
        throw new middleware_1.NotFoundError('Member not found in this conversation');
    }
    if (wouldRemoveLastOwner(conversation, memberId)) {
        throw new middleware_1.BadRequestError('Cannot remove the last OWNER. Transfer ownership first or add another OWNER');
    }
    await prisma_1.prisma.conversationMember.delete({
        where: {
            id: memberToRemove.id,
        },
    });
    return findConversationWithMembers(conversationId);
};
exports.removeConversationMember = removeConversationMember;
// Leave a conversation
const leaveConversation = async (conversationId, userId) => {
    const conversation = await (0, exports.findConversationWithBasicMembers)(conversationId);
    const membership = findUserMembership(conversation, userId);
    if (!membership) {
        throw new middleware_1.NotFoundError('You are not a member of this conversation');
    }
    preventDirectConversationModification(conversation.type);
    if (wouldRemoveLastOwner(conversation, userId)) {
        throw new middleware_1.BadRequestError('Cannot leave as the last OWNER. Transfer ownership first or add another OWNER');
    }
    await prisma_1.prisma.conversationMember.delete({
        where: {
            id: membership.id,
        },
    });
};
exports.leaveConversation = leaveConversation;
// Update a member's role (OWNER or ADMIN only, with hierarchy enforcement)
const updateMemberRole = async (conversationId, actorId, memberId, newRole) => {
    validateMemberId(memberId);
    if (actorId === memberId) {
        throw new middleware_1.BadRequestError('Cannot change your own role');
    }
    if (![client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN, client_1.MemberRole.MEMBER].includes(newRole)) {
        throw new middleware_1.BadRequestError('Invalid role. Allowed roles: OWNER, ADMIN, MEMBER');
    }
    const canManage = await (0, permissions_service_1.canManageMembers)(actorId, conversationId);
    if (!canManage) {
        throw new middleware_1.AuthorizationError('Only OWNER or ADMIN can update member roles');
    }
    const conversation = await (0, exports.findConversationWithBasicMembers)(conversationId);
    preventDirectConversationModification(conversation.type);
    const actorMember = findUserMembership(conversation, actorId);
    const targetMember = findUserMembership(conversation, memberId);
    if (!actorMember) {
        throw new middleware_1.AuthorizationError('You are not a member of this conversation');
    }
    if (!targetMember) {
        throw new middleware_1.NotFoundError('Target member not found in this conversation');
    }
    if (targetMember.role === newRole) {
        throw new middleware_1.BadRequestError(`Member already has the role ${newRole}`);
    }
    if (!hasHigherRole(actorMember.role, targetMember.role)) {
        throw new middleware_1.AuthorizationError('You can only change roles of members with lower roles than yours');
    }
    if (getRoleLevel(newRole) >= getRoleLevel(actorMember.role)) {
        throw new middleware_1.AuthorizationError('You cannot promote someone to your role or higher');
    }
    if (wouldRemoveLastOwnerByRoleChange(conversation, memberId, newRole)) {
        throw new middleware_1.BadRequestError('Cannot demote the last OWNER. Promote another member to OWNER first');
    }
    await prisma_1.prisma.conversationMember.update({
        where: {
            id: targetMember.id,
        },
        data: {
            role: newRole,
        },
    });
    return findConversationWithMembers(conversationId);
};
exports.updateMemberRole = updateMemberRole;
// List all public channels
const listPublicChannels = async (filters) => {
    const where = {
        type: client_1.ConversationType.CHANNEL,
        isPublic: true,
    };
    if (filters?.name) {
        where.name = {
            contains: filters.name,
            mode: 'insensitive',
        };
    }
    return prisma_1.prisma.conversation.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        include: {
            _count: {
                select: {
                    members: true,
                },
            },
        },
    });
};
exports.listPublicChannels = listPublicChannels;
// Check if ban is active (not expired)
const isBanActive = (ban) => {
    if (!ban.expiresAt)
        return true;
    return ban.expiresAt > new Date();
};
// Join a public channel by slug
const joinChannelBySlug = async (slug, userId) => {
    const channel = await prisma_1.prisma.conversation.findUnique({
        where: { slug },
        include: {
            members: true,
        },
    });
    if (!channel) {
        throw new middleware_1.NotFoundError('Channel');
    }
    if (!channel.isPublic || channel.type !== client_1.ConversationType.CHANNEL) {
        throw new middleware_1.BadRequestError('This is not a public channel');
    }
    const existingMember = channel.members.find((m) => m.userId === userId);
    if (existingMember) {
        throw new middleware_1.BadRequestError('You are already a member of this channel');
    }
    const activeBan = await prisma_1.prisma.channelBan.findUnique({
        where: {
            userId_conversationId: {
                userId,
                conversationId: channel.id,
            },
        },
    });
    if (activeBan && isBanActive(activeBan)) {
        const message = activeBan.expiresAt
            ? `You are banned from this channel until ${activeBan.expiresAt.toISOString()}`
            : 'You are permanently banned from this channel';
        throw new middleware_1.AuthorizationError(message);
    }
    await prisma_1.prisma.conversationMember.create({
        data: {
            userId,
            conversationId: channel.id,
            role: client_1.MemberRole.MEMBER,
        },
    });
    return findConversationWithMembers(channel.id);
};
exports.joinChannelBySlug = joinChannelBySlug;
// Clean up slug by removing special characters and replacing spaces
const cleanSlugName = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
};
// Find next available slug if base exists
const findAvailableSlug = async (baseSlug) => {
    const existing = await prisma_1.prisma.conversation.findUnique({
        where: { slug: baseSlug },
    });
    if (!existing) {
        return baseSlug;
    }
    let counter = 1;
    let slug = `${baseSlug}-${counter}`;
    while (await prisma_1.prisma.conversation.findUnique({ where: { slug } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
    }
    return slug;
};
// Generate unique slug from channel name
const generateSlug = async (name) => {
    const baseSlug = cleanSlugName(name);
    return findAvailableSlug(baseSlug);
};
exports.generateSlug = generateSlug;
// Build conversation search where clause
const buildConversationSearchWhere = (searchQuery, type, currentUserId) => {
    const baseWhere = {
        OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
    };
    if (type === 'DIRECT') {
        return {
            ...baseWhere,
            type: client_1.ConversationType.DIRECT,
            members: {
                some: { userId: currentUserId },
            },
        };
    }
    if (type === 'GROUP') {
        return {
            ...baseWhere,
            type: client_1.ConversationType.GROUP,
            AND: [
                {
                    OR: [
                        { isPublic: true },
                        { members: { some: { userId: currentUserId } } },
                    ],
                },
            ],
        };
    }
    if (type === 'CHANNEL') {
        return {
            ...baseWhere,
            type: client_1.ConversationType.CHANNEL,
            AND: [
                {
                    OR: [
                        { isPublic: true },
                        { members: { some: { userId: currentUserId } } },
                    ],
                },
            ],
        };
    }
    return {
        ...baseWhere,
        AND: [
            {
                OR: [
                    { isPublic: true },
                    { members: { some: { userId: currentUserId } } },
                ],
            },
        ],
    };
};
// Search conversations and users
const searchConversations = async (query, currentUserId, type) => {
    const searchQuery = query.trim();
    if (!searchQuery) {
        return { conversations: [], users: [] };
    }
    const conversationWhere = buildConversationSearchWhere(searchQuery, type, currentUserId);
    const searchUsers = !type || type === 'ALL';
    const conversations = await prisma_1.prisma.conversation.findMany({
        where: conversationWhere,
        orderBy: {
            updatedAt: 'desc',
        },
        take: 20,
    });
    let users = [];
    if (searchUsers) {
        users = await prisma_1.prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                name: { contains: searchQuery, mode: 'insensitive' },
            },
            orderBy: {
                name: 'asc',
            },
            take: 20,
        });
    }
    return { conversations, users };
};
exports.searchConversations = searchConversations;
// Normalize pagination limit to safe boundaries
const normalizePaginationLimit = (limit) => {
    return Math.min(limit || 20, 50);
};
// Get attachments for a conversation with pagination
const getConversationAttachments = async (conversationId, userId, type, pagination) => {
    const conversation = await (0, exports.findConversationWithBasicMembers)(conversationId);
    verifyUserIsMember(conversation, userId);
    const limit = normalizePaginationLimit(pagination?.limit);
    const cursor = pagination?.cursor;
    const where = {
        message: {
            conversationId,
            deletedAt: null,
        },
    };
    if (type) {
        where.type = type;
    }
    const attachments = await prisma_1.prisma.attachment.findMany({
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
    const nextCursor = hasMore && returnAttachments.length > 0
        ? returnAttachments[returnAttachments.length - 1].id
        : null;
    return {
        attachments: returnAttachments,
        nextCursor,
        hasMore,
    };
};
exports.getConversationAttachments = getConversationAttachments;
// Delete a conversation
const deleteConversation = async (conversationId, actorId) => {
    const conversation = await (0, exports.findConversationWithBasicMembers)(conversationId);
    const membership = findUserMembership(conversation, actorId);
    if (!membership) {
        throw new middleware_1.NotFoundError('You are not a member of this conversation');
    }
    if (conversation.type !== client_1.ConversationType.DIRECT && membership.role !== client_1.MemberRole.OWNER) {
        throw new middleware_1.AuthorizationError('Only OWNER can delete this conversation');
    }
    await prisma_1.prisma.conversation.delete({
        where: { id: conversationId },
    });
};
exports.deleteConversation = deleteConversation;
