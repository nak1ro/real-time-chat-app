"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.declineInvitation = exports.acceptInvitation = exports.inviteMembersToConversation = exports.setSocketServer = void 0;
const middleware_1 = require("../../middleware");
const invitationService = __importStar(require("../../services/conversations/invitation.service"));
const services_1 = require("../../services");
const socket_notifications_1 = require("../../sockets/handlers/socket.notifications");
const sockets_1 = require("../../sockets");
// Socket server instance (will be injected)
let io;
const setSocketServer = (server) => {
    io = server;
};
exports.setSocketServer = setSocketServer;
/**
 * POST /conversations/:id/invitations
 * Invite members to a conversation (requires ADMIN or OWNER role)
 */
exports.inviteMembersToConversation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const currentUserId = req.user?.id;
    const { id: conversationId } = req.params;
    const { recipientIds } = req.body;
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'recipientIds must be a non-empty array',
        });
    }
    const { invitations, notifications } = await invitationService.createInvitations(conversationId, currentUserId, recipientIds);
    // Emit socket events for each notification
    if (io && notifications.length > 0) {
        for (const notification of notifications) {
            // Emit new notification event
            (0, socket_notifications_1.notifyUser)(io, notification.userId, notification);
            // Get and emit updated unread count
            const count = await (0, services_1.getUnreadCount)(notification.userId);
            io.to(notification.userId).emit(sockets_1.SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { count });
        }
    }
    res.status(201).json({
        status: 'success',
        data: {
            invitations,
            count: invitations.length,
        },
    });
});
/**
 * POST /invitations/:invitationId/accept
 * Accept an invitation to join a conversation
 */
exports.acceptInvitation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { invitationId } = req.params;
    const result = await invitationService.acceptInvitation(invitationId, userId);
    // Emit updated unread count via socket
    if (io) {
        const count = await (0, services_1.getUnreadCount)(userId);
        io.to(userId).emit(sockets_1.SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { count });
    }
    res.status(200).json({
        status: 'success',
        data: {
            conversationId: result.conversationId,
            conversation: result.conversation,
        },
    });
});
/**
 * POST /invitations/:invitationId/decline
 * Decline an invitation to join a conversation
 */
exports.declineInvitation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { invitationId } = req.params;
    await invitationService.declineInvitation(invitationId, userId);
    // Emit updated unread count via socket
    if (io) {
        const count = await (0, services_1.getUnreadCount)(userId);
        io.to(userId).emit(sockets_1.SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { count });
    }
    res.status(200).json({
        status: 'success',
        data: {
            message: 'Invitation declined successfully',
        },
    });
});
