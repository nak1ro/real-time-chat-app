import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../middleware';

interface ToggleReactionParams {
  userId: string;
  messageId: string;
  emoji: string;
}

interface ReactionAction {
  action: 'added' | 'removed';
}

// Helper: Verify message exists
const verifyMessageExists = async (messageId: string): Promise<void> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new NotFoundError('Message');
  }
};

// Helper: Check if reaction exists for user
const getExistingReaction = async (
  userId: string,
  messageId: string,
  emoji: string
) => {
  return prisma.messageReaction.findUnique({
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
const addReaction = async (userId: string, messageId: string, emoji: string): Promise<void> => {
  await prisma.messageReaction.create({
    data: {
      userId,
      messageId,
      emoji,
    },
  });
};

// Helper: Remove an existing reaction
const removeReaction = async (reactionId: string): Promise<void> => {
  await prisma.messageReaction.delete({
    where: {
      id: reactionId,
    },
  });
};

// Toggle reaction for a message
export const toggleReaction = async ({
  userId,
  messageId,
  emoji,
}: ToggleReactionParams): Promise<ReactionAction> => {
  await verifyMessageExists(messageId);

  const existingReaction = await getExistingReaction(userId, messageId, emoji);

  if (existingReaction) {
    await removeReaction(existingReaction.id);
    return { action: 'removed' };
  } else {
    await addReaction(userId, messageId, emoji);
    return { action: 'added' };
  }
};

// Helper: Aggregate reactions by emoji
const aggregateReactionsByEmoji = (
  reactions: Array<{ emoji: string; userId: string }>
): Record<string, string[]> => {
  return reactions.reduce((acc, curr) => {
    if (!acc[curr.emoji]) {
      acc[curr.emoji] = [];
    }
    acc[curr.emoji].push(curr.userId);
    return acc;
  }, {} as Record<string, string[]>);
};

// Get all reactions for a message
export const getMessageReactions = async (messageId: string) => {
  const reactions = await prisma.messageReaction.findMany({
    where: { messageId },
    select: {
      emoji: true,
      userId: true,
    },
  });

  return aggregateReactionsByEmoji(reactions);
};

