"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleToggleReaction = void 0;
const reaction_service_1 = require("../../services/messages/reaction.service");
const socket_utils_1 = require("../core/socket.utils");
const prisma_1 = require("../../db/prisma");
const notification_service_1 = require("../../services/messages/notification.service");
const socket_notifications_1 = require("./socket.notifications");
const handleToggleReaction = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    const { messageId, emoji } = data;
    try {
        // Toggle reaction
        const result = await (0, reaction_service_1.toggleReaction)({ userId, messageId, emoji });
        // Get message details for broadcasting and notifications
        const message = await prisma_1.prisma.message.findUnique({
            where: { id: messageId },
            select: {
                conversationId: true,
                userId: true, // Message author ID
                text: true,
            },
        });
        // Get reactor's details for broadcasting
        const reactor = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                avatarUrl: true,
            },
        });
        if (message && reactor) {
            // Broadcast update to conversation
            io.to(message.conversationId).emit(socket_utils_1.SOCKET_EVENTS.REACTION_UPDATED, {
                messageId,
                emoji,
                userId,
                action: result.action,
                user: reactor,
            });
            // Create notification if:
            // 1. Reaction was added (not removed)
            // 2. Reactor is NOT the message author (don't notify yourself)
            if (result.action === 'added' && message.userId !== userId) {
                try {
                    // Reactor is already fetched above as 'reactor'
                    const notification = await (0, notification_service_1.createNotification)({
                        userId: message.userId, // Notify the message author
                        type: 'REACTION',
                        title: `${reactor?.name || 'Someone'} reacted to your message`,
                        body: `${emoji} · ${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}`,
                        conversationId: message.conversationId,
                        messageId: messageId,
                        actorId: userId,
                    });
                    // Emit notification to message author
                    (0, socket_notifications_1.notifyUser)(io, message.userId, notification);
                }
                catch (notifError) {
                    console.error('Failed to create reaction notification:', notifError);
                    // Don't fail the reaction if notification fails
                }
            }
        }
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)(result));
    }
    catch (error) {
        console.error(`Failed to toggle reaction for user ${userId}:`, error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to toggle reaction')));
    }
};
exports.handleToggleReaction = handleToggleReaction;
