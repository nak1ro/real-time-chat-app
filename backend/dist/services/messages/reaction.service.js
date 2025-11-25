"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageReactions = exports.toggleReaction = void 0;
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
const toggleReaction = async ({ userId, messageId, emoji, }) => {
    // Verify message exists
    const message = await prisma_1.prisma.message.findUnique({
        where: { id: messageId },
    });
    if (!message) {
        throw new middleware_1.NotFoundError('Message');
    }
    // Check if reaction exists
    const existingReaction = await prisma_1.prisma.messageReaction.findUnique({
        where: {
            userId_messageId_emoji: {
                userId,
                messageId,
                emoji,
            },
        },
    });
    if (existingReaction) {
        await prisma_1.prisma.messageReaction.delete({
            where: {
                id: existingReaction.id,
            },
        });
        return { action: 'removed' };
    }
    else {
        await prisma_1.prisma.messageReaction.create({
            data: {
                userId,
                messageId,
                emoji,
            },
        });
        return { action: 'added' };
    }
};
exports.toggleReaction = toggleReaction;
const getMessageReactions = async (messageId) => {
    const reactions = await prisma_1.prisma.messageReaction.findMany({
        where: { messageId },
        select: {
            emoji: true,
            userId: true,
        },
    });
    const aggregated = reactions.reduce((acc, curr) => {
        if (!acc[curr.emoji]) {
            acc[curr.emoji] = [];
        }
        acc[curr.emoji].push(curr.userId);
        return acc;
    }, {});
    return aggregated;
};
exports.getMessageReactions = getMessageReactions;
