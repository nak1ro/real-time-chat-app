"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const prisma_1 = require("./db/prisma");
const routes_1 = __importDefault(require("./routes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const app = (0, express_1.default)();
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
        res.json({ status: 'ok' });
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
    app.listen(env_1.env.port, () => {
        console.log(`Backend running on http://${env_1.env.host}:${env_1.env.port} (${env_1.env.nodeEnv})`);
    });
}
startServer();
