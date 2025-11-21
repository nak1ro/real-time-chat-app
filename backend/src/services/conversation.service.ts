import {Conversation, ConversationType, MemberRole} from '@prisma/client';
import {prisma} from '../db/prisma';
import {ConversationWithMembers, CreateConversationData} from '../domain';
import {BadRequestError, NotFoundError} from '../middleware';

/**
 * Create or get existing direct conversation between two users
 * 
 * @param currentUserId - The ID of the current user
 * @param otherUserId - The ID of the other user
 * @returns The direct conversation between the two users
 */
export const createDirectConversation = async (
  currentUserId: string,
  otherUserId: string
): Promise<ConversationWithMembers> => {
  // Validate that the users are different
  if (currentUserId === otherUserId) {
    throw new BadRequestError('Cannot create a direct conversation with yourself');
  }

  // Verify both users exist
  const [currentUser, otherUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: currentUserId } }),
    prisma.user.findUnique({ where: { id: otherUserId } }),
  ]);

  if (!currentUser) {
    throw new NotFoundError(`User with ID ${currentUserId} not found`);
  }

  if (!otherUser) {
    throw new NotFoundError(`User with ID ${otherUserId} not found`);
  }

  // Search for existing direct conversation where both users are members
  // We need to find a conversation of type DIRECT that has both users as members
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      type: ConversationType.DIRECT,
      members: {
        every: {
          OR: [
            { userId: currentUserId },
            { userId: otherUserId },
          ],
        },
        // Ensure there are exactly 2 members
        some: {
          userId: currentUserId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  // Additional check: ensure the conversation has exactly both users
  if (existingConversation) {
    const memberUserIds = existingConversation.members.map((m) => m.userId);
    const hasCurrentUser = memberUserIds.includes(currentUserId);
    const hasOtherUser = memberUserIds.includes(otherUserId);
    const hasOnlyTwoMembers = memberUserIds.length === 2;

    if (hasCurrentUser && hasOtherUser && hasOnlyTwoMembers) {
      return existingConversation;
    }
  }

  // If no existing conversation found, create a new one
  return await prisma.conversation.create({
    data: {
      name: `${currentUser.name}, ${otherUser.name}`,
      type: ConversationType.DIRECT,
      createdById: currentUserId,
      members: {
        create: [
          {
            userId: currentUserId,
            role: MemberRole.MEMBER,
          },
          {
            userId: otherUserId,
            role: MemberRole.MEMBER,
          },
        ],
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });
};

/**
 * Create a group or channel conversation
 * 
 * @param currentUserId - The ID of the user creating the conversation
 * @param data - Conversation creation data
 * @returns The newly created conversation with the creator as OWNER
 */
export const createGroupOrChannelConversation = async (
  currentUserId: string,
  data: CreateConversationData
): Promise<ConversationWithMembers> => {
  // Verify the user exists
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
  });

  if (!currentUser) {
    throw new NotFoundError(`User with ID ${currentUserId} not found`);
  }

  // Validate conversation type
  if (data.type !== 'GROUP' && data.type !== 'CHANNEL') {
    throw new BadRequestError('Conversation type must be GROUP or CHANNEL');
  }

  // Create the conversation with the creator as OWNER
  const newConversation = await prisma.conversation.create({
    data: {
      name: data.name,
      type: ConversationType[data.type],
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
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  return newConversation;
};

/**
 * Find conversation by ID
 * 
 * @param conversationId - The ID of the conversation
 * @param includeMembers - Whether to include members in the result
 * @returns The conversation or null if not found
 */
export const findConversationById = async (
  conversationId: string,
  includeMembers: boolean = false
): Promise<Conversation | ConversationWithMembers | null> => {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: includeMembers,
    },
  });
};

/**
 * Get all conversations for a user
 * 
 * @param userId - The ID of the user
 * @returns Array of conversations the user is a member of
 */
export const getUserConversations = async (
  userId: string
): Promise<ConversationWithMembers[]> => {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return conversations;
};

