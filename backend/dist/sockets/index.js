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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocketIO = void 0;
const socket_io_1 = require("socket.io");
const env_1 = require("../config/env");
const socket_auth_1 = require("./core/socket.auth");
const socket_handlers_1 = require("./handlers/socket.handlers");
const socket_utils_1 = require("./core/socket.utils");
// Socket.IO server configuration
const SOCKET_CONFIG = {
    CONNECT_TIMEOUT: 10000,
    PING_TIMEOUT: 5000,
    PING_INTERVAL: 25000,
};
// Initialize Socket.IO server with authentication and handlers
const initializeSocketIO = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.corsOrigin,
            credentials: true,
            methods: ['GET', 'POST'],
        },
        connectTimeout: SOCKET_CONFIG.CONNECT_TIMEOUT,
        pingTimeout: SOCKET_CONFIG.PING_TIMEOUT,
        pingInterval: SOCKET_CONFIG.PING_INTERVAL,
    });
    // Apply authentication middleware
    io.use(socket_auth_1.socketAuthMiddleware);
    io.on(socket_utils_1.SOCKET_EVENTS.CONNECT, (socket) => {
        (0, socket_handlers_1.handleConnection)(io, socket);
    });
    // Handle connection errors
    io.engine.on('connection_error', (err) => {
        console.error('Socket connection error:', {
            message: err.message,
            code: err.code,
            context: err.context,
        });
    });
    console.log('Socket.IO server initialized');
    return io;
};
exports.initializeSocketIO = initializeSocketIO;
// Core exports
__exportStar(require("./core/socket.types"), exports);
__exportStar(require("./core/socket.auth"), exports);
__exportStar(require("./core/socket.utils"), exports);
// Handler exports
__exportStar(require("./handlers/socket.handlers"), exports);
__exportStar(require("./handlers/socket.rooms"), exports);
__exportStar(require("./handlers/socket.messages"), exports);
__exportStar(require("./handlers/socket.mentions"), exports);
__exportStar(require("./handlers/socket.reactions"), exports);
__exportStar(require("./handlers/socket.receipts"), exports);
__exportStar(require("./handlers/socket.presence"), exports);
