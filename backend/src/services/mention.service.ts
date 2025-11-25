import { prisma } from '../db/prisma';
import { findUserByName } from './user.service';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from './service-constants';

// Parse mentions from text
export const parseMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);

    if (!matches) return [];

    // Remove @ prefix and return unique names
    return [...new Set(matches.map(match => match.slice(1)))];
};

// Process mentions for a message
export const processMentions = async (
    messageId: string,
    text: string
): Promise<string[]> => {
    const usernames = parseMentions(text);

    if (usernames.length === 0) return [];

    const mentionedUserIds: string[] = [];

    for (const username of usernames) {
        const user = await findUserByName(username);

        if (user) {
            try {
                await prisma.messageMention.create({
                    data: {
                        messageId,
                        userId: user.id,
                    },
                });
                mentionedUserIds.push(user.id);
            } catch (error) {
                // Ignore duplicate mentions (handled by unique constraint)
                console.warn(`Failed to create mention for user ${username}:`, error);
            }
        }
    }

    return mentionedUserIds;
};

// Get mentions for a user
export const getMentionsForUser = async (
    userId: string,
    options?: {
        limit?: number;
        cursor?: string;
    }
) => {
    const limit = Math.min(options?.limit || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);

    const mentions = await prisma.messageMention.findMany({
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
