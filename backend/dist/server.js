"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const prisma_1 = require("./db/prisma");
const routes_1 = __importDefault(require("./routes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const sockets_1 = require("./sockets");
const invitation_controller_1 = require("./controllers/conversations/invitation.controller");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.IO
const io = (0, sockets_1.initializeSocketIO)(httpServer);
exports.io = io;
// Make io accessible to routes if needed
app.set('io', io);
// Inject socket server into invitation controller
(0, invitation_controller_1.setSocketServer)(io);
// Middleware
app.use((0, cors_1.default)({
    origin: env_1.env.corsOrigin,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Basic routes
app.get('/', (_req, res) => {
    res.send({ status: 'ok', env: env_1.env.nodeEnv });
});
app.get('/health', async (_req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ok', socketConnected: io.engine.clientsCount });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
});
// API routes
app.use('/api', routes_1.default);
// Error handling (must be last)
app.use(errorMiddleware_1.notFoundHandler);
app.use(errorMiddleware_1.errorHandler);
function startServer() {
    httpServer.listen(env_1.env.port, () => {
        console.log(`🚀 Backend running on http://${env_1.env.host}:${env_1.env.port} (${env_1.env.nodeEnv})`);
        console.log(`🔌 Socket.IO ready for connections`);
    });
}
startServer();
