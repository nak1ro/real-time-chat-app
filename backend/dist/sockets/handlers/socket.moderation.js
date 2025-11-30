"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleModerationAction = void 0;
const moderation_service_1 = require("../../services/conversations/moderation.service");
const socket_utils_1 = require("../core/socket.utils");
// Handle moderation:action event
const handleModerationAction = async (io, socket, data, callback) => {
    const { userId, userName } = socket.data;
    try {
        console.log(`[Socket Moderation] User ${userName} (${userId}) applying ${data.action} in conversation ${data.conversationId}`);
        // Apply moderation action through existing service
        await (0, moderation_service_1.applyModerationAction)({
            actorId: userId,
            action: data.action,
            conversationId: data.conversationId,
            targetUserId: data.targetUserId,
            messageId: data.messageId,
            reason: data.reason,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        });
        // Prepare broadcast payload
        const updatePayload = {
            action: data.action,
            conversationId: data.conversationId,
            targetUserId: data.targetUserId,
            messageId: data.messageId,
            actorId: userId,
            actorName: userName,
            reason: data.reason,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        };
        // Broadcast to conversation room
        io.to(data.conversationId).emit(socket_utils_1.SOCKET_EVENTS.MODERATION_UPDATED, updatePayload);
        console.log(`[Socket Moderation] Action ${data.action} applied successfully, broadcasted to conversation ${data.conversationId}`);
        // Send success response
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ message: `Moderation action ${data.action} applied successfully` }));
    }
    catch (error) {
        console.error('[Socket Moderation] Failed to apply moderation action:', error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to apply moderation action')));
    }
};
exports.handleModerationAction = handleModerationAction;
