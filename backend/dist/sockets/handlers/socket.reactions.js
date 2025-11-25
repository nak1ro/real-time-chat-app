"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleToggleReaction = void 0;
const reaction_service_1 = require("../../services/messages/reaction.service");
const socket_utils_1 = require("../core/socket.utils");
const prisma_1 = require("../../db/prisma");
const handleToggleReaction = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    const { messageId, emoji } = data;
    try {
        // Toggle reaction
        const result = await (0, reaction_service_1.toggleReaction)({ userId, messageId, emoji });
        // Get conversationId for broadcasting
        const message = await prisma_1.prisma.message.findUnique({
            where: { id: messageId },
            select: { conversationId: true },
        });
        if (message) {
            // Broadcast update
            io.to(message.conversationId).emit(socket_utils_1.SOCKET_EVENTS.REACTION_UPDATED, {
                messageId,
                emoji,
                userId,
                action: result.action,
            });
        }
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)(result));
    }
    catch (error) {
        console.error(`Failed to toggle reaction for user ${userId}:`, error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to toggle reaction')));
    }
};
exports.handleToggleReaction = handleToggleReaction;
