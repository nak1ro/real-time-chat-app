"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
const token_service_1 = require("../services/token.service");
const user_service_1 = require("../services/user.service");
/**
 * Socket.IO authentication middleware
 * Verifies JWT token and attaches user data to socket
 */
const socketAuthMiddleware = async (socket, next) => {
    try {
        // Extract token from handshake auth or query
        const token = socket.handshake.auth.token ||
            socket.handshake.headers.authorization?.replace('Bearer ', '') ||
            socket.handshake.query.token;
        if (!token) {
            return next(new Error('Authentication token required'));
        }
        // Verify token
        const payload = (0, token_service_1.verifyToken)(token);
        if (!payload.userId) {
            return next(new Error('Invalid token payload'));
        }
        // Verify user exists
        const user = await (0, user_service_1.findUserById)(payload.userId);
        if (!user) {
            return next(new Error('User not found'));
        }
        // Attach user data to socket
        const socketData = {
            userId: user.id,
            userName: user.name,
        };
        socket.data = socketData;
        next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        next(new Error(message));
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;
