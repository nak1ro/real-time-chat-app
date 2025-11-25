"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMemberOfConversation = exports.verifyMembership = exports.verifyMessageExists = exports.verifyConversationExists = exports.verifyUsersExist = exports.verifyUserExists = exports.verifyEntityExists = void 0;
const prisma_1 = require("../db/prisma");
const middleware_1 = require("../middleware");
// Generic entity verification
// Find an entity by ID or throw NotFoundError
const verifyEntityExists = async (findOperation, entityName) => {
    const entity = await findOperation();
    if (!entity) {
        throw new middleware_1.NotFoundError(entityName);
    }
    return entity;
};
exports.verifyEntityExists = verifyEntityExists;
// User verification
// Verify that a user exists by ID
const verifyUserExists = async (userId) => {
    return (0, exports.verifyEntityExists)(() => prisma_1.prisma.user.findUnique({ where: { id: userId } }), `User with ID ${userId}`);
};
exports.verifyUserExists = verifyUserExists;
// Verify that multiple users exist
const verifyUsersExist = async (userIds) => {
    const users = await Promise.all(userIds.map(exports.verifyUserExists));
    return users;
};
exports.verifyUsersExist = verifyUsersExist;
// Conversation verification
// Verify that a conversation exists by ID
const verifyConversationExists = async (conversationId) => {
    return (0, exports.verifyEntityExists)(() => prisma_1.prisma.conversation.findUnique({ where: { id: conversationId } }), 'Conversation');
};
exports.verifyConversationExists = verifyConversationExists;
// Message verification
// Verify that a message exists by ID
const verifyMessageExists = async (messageId) => {
    return (0, exports.verifyEntityExists)(() => prisma_1.prisma.message.findUnique({ where: { id: messageId } }), 'Message');
};
exports.verifyMessageExists = verifyMessageExists;
// Membership verification
// Verify user is a member of a conversation
const verifyMembership = async (userId, conversationId) => {
    const membership = await prisma_1.prisma.conversationMember.findFirst({
        where: { userId, conversationId },
    });
    if (!membership) {
        throw new middleware_1.AuthorizationError('You are not a member of this conversation');
    }
    return membership;
};
exports.verifyMembership = verifyMembership;
// Check if user is a member (returns boolean)
const isMemberOfConversation = async (userId, conversationId) => {
    const membership = await prisma_1.prisma.conversationMember.findFirst({
        where: { userId, conversationId },
    });
    return membership !== null;
};
exports.isMemberOfConversation = isMemberOfConversation;
