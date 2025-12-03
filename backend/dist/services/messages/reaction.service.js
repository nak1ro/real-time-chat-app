"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageReactions = exports.toggleReaction = void 0;
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
// Helper: Verify message exists
const verifyMessageExists = async (messageId) => {
    const message = await prisma_1.prisma.message.findUnique({
        where: { id: messageId },
    });
    if (!message) {
        throw new middleware_1.NotFoundError('Message');
    }
};
// Helper: Check if reaction exists for user
const getExistingReaction = async (userId, messageId, emoji) => {
    return prisma_1.prisma.messageReaction.findUnique({
        where: {
            userId_messageId_emoji: {
                userId,
                messageId,
                emoji,
            },
        },
    });
};
// Helper: Add a new reaction
const addReaction = async (userId, messageId, emoji) => {
    await prisma_1.prisma.messageReaction.create({
        data: {
            userId,
            messageId,
            emoji,
        },
    });
};
// Helper: Remove an existing reaction
const removeReaction = async (reactionId) => {
    await prisma_1.prisma.messageReaction.delete({
        where: {
            id: reactionId,
        },
    });
};
// Toggle reaction for a message
const toggleReaction = async ({ userId, messageId, emoji, }) => {
    await verifyMessageExists(messageId);
    const existingReaction = await getExistingReaction(userId, messageId, emoji);
    if (existingReaction) {
        await removeReaction(existingReaction.id);
        return { action: 'removed' };
    }
    else {
        await addReaction(userId, messageId, emoji);
        return { action: 'added' };
    }
};
exports.toggleReaction = toggleReaction;
// Helper: Aggregate reactions by emoji
const aggregateReactionsByEmoji = (reactions) => {
    return reactions.reduce((acc, curr) => {
        if (!acc[curr.emoji]) {
            acc[curr.emoji] = [];
        }
        acc[curr.emoji].push(curr.userId);
        return acc;
    }, {});
};
// Get all reactions for a message
const getMessageReactions = async (messageId) => {
    const reactions = await prisma_1.prisma.messageReaction.findMany({
        where: { messageId },
        select: {
            emoji: true,
            userId: true,
        },
    });
    return aggregateReactionsByEmoji(reactions);
};
exports.getMessageReactions = getMessageReactions;
