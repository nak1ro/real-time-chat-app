"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
const token_service_1 = require("../../services/auth/token.service");
const user_service_1 = require("../../services/users/user.service");
// Extract token from socket handshake (auth, header, or query)
const extractToken = (socket) => {
    return (socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '') ||
        socket.handshake.query.token ||
        null);
};
// Create authentication error
const createAuthError = (message) => {
    return new Error(message);
};
// Socket.IO authentication middleware
const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = extractToken(socket);
        if (!token) {
            return next(createAuthError('Authentication token required'));
        }
        const payload = (0, token_service_1.verifyToken)(token);
        if (!payload.userId) {
            return next(createAuthError('Invalid token payload'));
        }
        const user = await (0, user_service_1.findUserById)(payload.userId);
        if (!user) {
            return next(createAuthError('User not found'));
        }
        const socketData = {
            userId: user.id,
            userName: user.name,
        };
        socket.data = socketData;
        next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        next(createAuthError(message));
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;
