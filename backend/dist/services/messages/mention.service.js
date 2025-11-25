"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMentionsForUser = exports.processMentions = exports.parseMentions = void 0;
const prisma_1 = require("../../db/prisma");
const user_service_1 = require("../users/user.service");
const service_constants_1 = require("../shared/service-constants");
// Parse mentions from text
const parseMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    if (!matches)
        return [];
    // Remove @ prefix and return unique names
    return [...new Set(matches.map(match => match.slice(1)))];
};
exports.parseMentions = parseMentions;
// Process mentions for a message
const processMentions = async (messageId, text) => {
    const usernames = (0, exports.parseMentions)(text);
    if (usernames.length === 0)
        return [];
    const mentionedUserIds = [];
    for (const username of usernames) {
        const user = await (0, user_service_1.findUserByName)(username);
        if (user) {
            try {
                await prisma_1.prisma.messageMention.create({
                    data: {
                        messageId,
                        userId: user.id,
                    },
                });
                mentionedUserIds.push(user.id);
            }
            catch (error) {
                // Ignore duplicate mentions (handled by unique constraint)
                console.warn(`Failed to create mention for user ${username}:`, error);
            }
        }
    }
    return mentionedUserIds;
};
exports.processMentions = processMentions;
// Get mentions for a user
const getMentionsForUser = async (userId, options) => {
    const limit = Math.min(options?.limit || service_constants_1.DEFAULT_PAGE_LIMIT, service_constants_1.MAX_PAGE_LIMIT);
    const mentions = await prisma_1.prisma.messageMention.findMany({
        where: { userId },
        take: limit + 1,
        cursor: options?.cursor ? { id: options.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            message: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                    conversation: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
            },
        },
    });
    const hasMore = mentions.length > limit;
    const items = hasMore ? mentions.slice(0, limit) : mentions;
    return {
        mentions: items,
        nextCursor: hasMore ? items[items.length - 1].id : null,
        hasMore,
    };
};
exports.getMentionsForUser = getMentionsForUser;
