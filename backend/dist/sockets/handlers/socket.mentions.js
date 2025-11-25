"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyMentionedUsers = void 0;
const socket_utils_1 = require("../core/socket.utils");
// Notify users that they have been mentioned
const notifyMentionedUsers = (io, message, mentionedUserIds) => {
    if (!mentionedUserIds || mentionedUserIds.length === 0)
        return;
    mentionedUserIds.forEach((userId) => {
        // Emit to specific user room (usually their userId)
        io.to(userId).emit(socket_utils_1.SOCKET_EVENTS.MENTION_NEW, {
            message,
            notification: {
                type: 'mention',
                title: `New mention from ${message.user?.name || 'Unknown'}`,
                body: message.text,
                conversationId: message.conversationId,
                messageId: message.id,
            },
        });
    });
};
exports.notifyMentionedUsers = notifyMentionedUsers;
