import { Server } from 'socket.io';
import { MessageWithRelations } from '../domain';
import { SOCKET_EVENTS } from './socket.utils';

// Notify users that they have been mentioned
export const notifyMentionedUsers = (
    io: Server,
    message: MessageWithRelations,
    mentionedUserIds: string[]
): void => {
    if (!mentionedUserIds || mentionedUserIds.length === 0) return;

    mentionedUserIds.forEach((userId) => {
        // Emit to specific user room (usually their userId)
        io.to(userId).emit(SOCKET_EVENTS.MENTION_NEW, {
            message,
            notification: {
                type: 'mention',
                title: `New mention from ${message.user.name}`,
                body: message.text,
                conversationId: message.conversationId,
                messageId: message.id,
            },
        });
    });
};
