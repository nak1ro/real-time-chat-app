"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = exports.joinChannelBySlug = exports.listPublicChannels = exports.updateMemberRole = exports.leaveConversation = exports.removeConversationMember = exports.addConversationMembers = exports.updateConversation = exports.getConversationByIdForUser = exports.listUserConversations = exports.findConversationById = exports.createGroupOrChannelConversation = exports.createDirectConversation = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
const permissions_service_1 = require("../users/permissions.service");
const service_constants_1 = require("../shared/service-constants");
const validation_helpers_1 = require("../../utils/validation-helpers");
// Constants
const ALLOWED_UPDATE_ROLES = [client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN];
const ALLOWED_ADD_MEMBER_ROLES = [client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN];
const ALLOWED_REMOVE_MEMBER_ROLES = [client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN];
const ALLOWED_UPDATE_ROLE_ROLES = [client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN];
// Role hierarchy (higher number = higher authority)
const ROLE_HIERARCHY = {
    [client_1.MemberRole.OWNER]: 3,
    [client_1.MemberRole.ADMIN]: 2,
    [client_1.MemberRole.MEMBER]: 0,
};
// Helper Functions
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
// Ensure user is a member of conversation or throw
const verifyUserIsMember = (conversation, userId) => {
    const isMember = conversation.members.some((member) => member.userId === userId);
    if (!isMember) {
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
// Check if removing a member would leave the conversation without an OWNER
const wouldRemoveLastOwner = (conversation, memberIdToRemove) => {
    const memberToRemove = conversation.members.find((m) => m.userId === memberIdToRemove);
    if (!memberToRemove || memberToRemove.role !== client_1.MemberRole.OWNER) {
        return false;
    }
    const ownerCount = conversation.members.filter((m) => m.role === client_1.MemberRole.OWNER).length;
    return ownerCount === 1;
};
// Check if changing a role would leave the conversation without an OWNER
const wouldRemoveLastOwnerByRoleChange = (conversation, memberId, newRole) => {
    const memberToChange = conversation.members.find((m) => m.userId === memberId);
    if (!memberToChange || memberToChange.role !== client_1.MemberRole.OWNER || newRole === client_1.MemberRole.OWNER) {
        return false;
    }
    const ownerCount = conversation.members.filter((m) => m.role === client_1.MemberRole.OWNER).length;
    return ownerCount === 1;
};
// Compare role hierarchy levels
const getRoleLevel = (role) => {
    return ROLE_HIERARCHY[role];
};
// Check if actor has higher role than target
const hasHigherRole = (actorRole, targetRole) => {
    return getRoleLevel(actorRole) > getRoleLevel(targetRole);
};
// Public API
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
// Find conversation by ID (optionally with members)
const findConversationById = async (conversationId, includeMembers = false) => {
    return prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: includeMembers ? service_constants_1.MEMBER_INCLUDE_WITH_USER : undefined,
    });
};
exports.findConversationById = findConversationById;
// List all conversations for a user with optional filters
const listUserConversations = async (userId, filters) => {
    const where = buildConversationWhereClause(userId, filters);
    return prisma_1.prisma.conversation.findMany({
        where,
        include: service_constants_1.MEMBER_INCLUDE_WITH_USER,
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
    // Verify actor has permission to update conversation
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
// Add members to a conversation (OWNER or ADMIN only)
const addConversationMembers = async (conversationId, actorId, userIds, role = client_1.MemberRole.MEMBER) => {
    if (!userIds.length) {
        throw new middleware_1.BadRequestError('At least one user ID must be provided');
    }
    // Remove duplicates from input
    const uniqueUserIds = [...new Set(userIds)];
    // Verify actor has permission to add members
    const canManage = await (0, permissions_service_1.canManageMembers)(actorId, conversationId);
    if (!canManage) {
        throw new middleware_1.AuthorizationError('Only OWNER or ADMIN can add members');
    }
    // Get conversation
    const conversation = await findConversationWithBasicMembers(conversationId);
    // Cannot add members to direct conversations
    if (conversation.type === client_1.ConversationType.DIRECT) {
        throw new middleware_1.BadRequestError('Cannot add members to direct conversations');
    }
    // Filter out users who are already members
    const { newUserIds, existingUserIds } = filterExistingMembers(conversation, uniqueUserIds);
    if (newUserIds.length === 0) {
        if (existingUserIds.length > 0) {
            throw new middleware_1.BadRequestError('All specified users are already members');
        }
        throw new middleware_1.BadRequestError('No valid users to add');
    }
    // Verify all new users exist
    await (0, validation_helpers_1.verifyUsersExist)(newUserIds);
    // Add members using a transaction
    await prisma_1.prisma.$transaction(newUserIds.map((userId) => prisma_1.prisma.conversationMember.create({
        data: {
            conversationId,
            userId,
            role,
        },
    })));
    // Return updated conversation with members
    return findConversationWithMembers(conversationId);
};
exports.addConversationMembers = addConversationMembers;
// Remove a member from a conversation (OWNER or ADMIN only)
const removeConversationMember = async (conversationId, actorId, memberId) => {
    if (!memberId) {
        throw new middleware_1.BadRequestError('Member ID must be provided');
    }
    if (actorId === memberId) {
        throw new middleware_1.BadRequestError('Cannot remove yourself. Use leaveConversation instead');
    }
    // Verify actor has permission to remove members
    const canManage = await (0, permissions_service_1.canManageMembers)(actorId, conversationId);
    if (!canManage) {
        throw new middleware_1.AuthorizationError('Only OWNER or ADMIN can remove members');
    }
    // Get conversation
    const conversation = await findConversationWithBasicMembers(conversationId);
    // Cannot remove members from direct conversations
    if (conversation.type === client_1.ConversationType.DIRECT) {
        throw new middleware_1.BadRequestError('Cannot remove members from direct conversations');
    }
    // Check if member exists in conversation
    const memberToRemove = findUserMembership(conversation, memberId);
    if (!memberToRemove) {
        throw new middleware_1.NotFoundError('Member not found in this conversation');
    }
    // Prevent removing the last OWNER
    if (wouldRemoveLastOwner(conversation, memberId)) {
        throw new middleware_1.BadRequestError('Cannot remove the last OWNER. Transfer ownership first or add another OWNER');
    }
    // Remove the member
    await prisma_1.prisma.conversationMember.delete({
        where: {
            id: memberToRemove.id,
        },
    });
    // Return updated conversation with members
    return findConversationWithMembers(conversationId);
};
exports.removeConversationMember = removeConversationMember;
// Leave a conversation
const leaveConversation = async (conversationId, userId) => {
    // Get conversation and verify membership
    const conversation = await findConversationWithBasicMembers(conversationId);
    const membership = findUserMembership(conversation, userId);
    if (!membership) {
        throw new middleware_1.NotFoundError('You are not a member of this conversation');
    }
    // Cannot leave direct conversations
    if (conversation.type === client_1.ConversationType.DIRECT) {
        throw new middleware_1.BadRequestError('Cannot leave direct conversations');
    }
    // Prevent last OWNER from leaving
    if (wouldRemoveLastOwner(conversation, userId)) {
        throw new middleware_1.BadRequestError('Cannot leave as the last OWNER. Transfer ownership first or add another OWNER');
    }
    // Remove the membership
    await prisma_1.prisma.conversationMember.delete({
        where: {
            id: membership.id,
        },
    });
};
exports.leaveConversation = leaveConversation;
// Update a member's role (OWNER or ADMIN only, with hierarchy enforcement)
const updateMemberRole = async (conversationId, actorId, memberId, newRole) => {
    if (!memberId) {
        throw new middleware_1.BadRequestError('Member ID must be provided');
    }
    if (actorId === memberId) {
        throw new middleware_1.BadRequestError('Cannot change your own role');
    }
    // Validate new role is allowed
    if (newRole !== client_1.MemberRole.OWNER &&
        newRole !== client_1.MemberRole.ADMIN &&
        newRole !== client_1.MemberRole.MEMBER) {
        throw new middleware_1.BadRequestError('Invalid role. Allowed roles: OWNER, ADMIN, MEMBER');
    }
    // Verify actor has permission to update member roles
    const canManage = await (0, permissions_service_1.canManageMembers)(actorId, conversationId);
    if (!canManage) {
        throw new middleware_1.AuthorizationError('Only OWNER or ADMIN can update member roles');
    }
    const conversation = await findConversationWithBasicMembers(conversationId);
    // Cannot change roles in direct conversations
    if (conversation.type === client_1.ConversationType.DIRECT) {
        throw new middleware_1.BadRequestError('Cannot change roles in direct conversations');
    }
    // Get actor and target member
    const actorMember = findUserMembership(conversation, actorId);
    const targetMember = findUserMembership(conversation, memberId);
    if (!actorMember) {
        throw new middleware_1.AuthorizationError('You are not a member of this conversation');
    }
    if (!targetMember) {
        throw new middleware_1.NotFoundError('Target member not found in this conversation');
    }
    // Check if target member already has the new role
    if (targetMember.role === newRole) {
        throw new middleware_1.BadRequestError(`Member already has the role ${newRole}`);
    }
    // Enforce hierarchy: actor must have higher role than target
    if (!hasHigherRole(actorMember.role, targetMember.role)) {
        throw new middleware_1.AuthorizationError('You can only change roles of members with lower roles than yours');
    }
    // Prevent promoting someone to a role equal or higher than actor's own role
    if (getRoleLevel(newRole) >= getRoleLevel(actorMember.role)) {
        throw new middleware_1.AuthorizationError('You cannot promote someone to your role or higher');
    }
    // Prevent demoting the last OWNER
    if (wouldRemoveLastOwnerByRoleChange(conversation, memberId, newRole)) {
        throw new middleware_1.BadRequestError('Cannot demote the last OWNER. Promote another member to OWNER first');
    }
    // Update the member's role
    await prisma_1.prisma.conversationMember.update({
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
exports.updateMemberRole = updateMemberRole;
// List all public channels
const listPublicChannels = async (filters) => {
    const where = {
        type: client_1.ConversationType.CHANNEL,
        isPublic: true,
    };
    // Apply optional name filter
    if (filters?.name) {
        where.name = {
            contains: filters.name,
            mode: 'insensitive',
        };
    }
    const channels = await prisma_1.prisma.conversation.findMany({
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
exports.listPublicChannels = listPublicChannels;
// Join a public channel by slug
const joinChannelBySlug = async (slug, userId) => {
    // Find channel by slug
    const channel = await prisma_1.prisma.conversation.findUnique({
        where: { slug },
        include: {
            members: true,
        },
    });
    if (!channel) {
        throw new middleware_1.NotFoundError('Channel');
    }
    // Verify it's a public channel
    if (!channel.isPublic || channel.type !== client_1.ConversationType.CHANNEL) {
        throw new middleware_1.BadRequestError('This is not a public channel');
    }
    // Check if user is already a member
    const existingMember = channel.members.find((m) => m.userId === userId);
    if (existingMember) {
        throw new middleware_1.BadRequestError('You are already a member of this channel');
    }
    // Check for active ban
    const now = new Date();
    const activeBan = await prisma_1.prisma.channelBan.findUnique({
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
        throw new middleware_1.AuthorizationError(message);
    }
    // Add user as member
    await prisma_1.prisma.conversationMember.create({
        data: {
            userId,
            conversationId: channel.id,
            role: client_1.MemberRole.MEMBER,
        },
    });
    // Return updated channel with members
    return findConversationWithMembers(channel.id);
};
exports.joinChannelBySlug = joinChannelBySlug;
// Generate unique slug from channel name
const generateSlug = async (name) => {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    // Check if slug exists
    const existing = await prisma_1.prisma.conversation.findUnique({
        where: { slug: baseSlug },
    });
    if (!existing) {
        return baseSlug;
    }
    // If exists, append number
    let counter = 1;
    let slug = `${baseSlug}-${counter}`;
    while (await prisma_1.prisma.conversation.findUnique({ where: { slug } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
    }
    return slug;
};
exports.generateSlug = generateSlug;
