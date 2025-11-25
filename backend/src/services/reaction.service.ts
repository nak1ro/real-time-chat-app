import { prisma } from '../db/prisma';
import { NotFoundError } from '../middleware';

interface ToggleReactionParams {
    userId: string;
    messageId: string;
    emoji: string;
}

interface ReactionAction {
    action: 'added' | 'removed';
}

export const toggleReaction = async ({
    userId,
    messageId,
    emoji,
}: ToggleReactionParams): Promise<ReactionAction> => {
    // Verify message exists
    const message = await prisma.message.findUnique({
        where: { id: messageId },
    });

    if (!message) {
        throw new NotFoundError('Message');
    }

    // Check if reaction exists
    const existingReaction = await prisma.messageReaction.findUnique({
        where: {
            userId_messageId_emoji: {
                userId,
                messageId,
                emoji,
            },
        },
    });

    if (existingReaction) {
        await prisma.messageReaction.delete({
            where: {
                id: existingReaction.id,
            },
        });
        return { action: 'removed' };
    } else {
        await prisma.messageReaction.create({
            data: {
                userId,
                messageId,
                emoji,
            },
        });
        return { action: 'added' };
    }
};

export const getMessageReactions = async (messageId: string) => {
    const reactions = await prisma.messageReaction.findMany({
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
    }, {} as Record<string, string[]>);

    return aggregated;
};
