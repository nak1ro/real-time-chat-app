import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './db/prisma';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { initializeSocketIO } from './sockets';
import { setSocketServer } from './controllers/conversations/invitation.controller';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocketIO(httpServer);

// Make io accessible to routes if needed
app.set('io', io);

// Inject socket server into invitation controller
setSocketServer(io);

// Middleware
app.use(
    cors({
        origin: env.corsOrigin,
        credentials: true,
    }),
);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Basic routes
app.get('/', (_req, res) => {
    res.send({ status: 'ok', env: env.nodeEnv });
});

app.get('/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', socketConnected: io.engine.clientsCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
});

// API routes
app.use('/api', routes);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export function startServer() {
    httpServer.listen(env.port, () => {
        console.log(`🚀 Backend running on http://${env.host}:${env.port} (${env.nodeEnv})`);
        console.log(`🔌 Socket.IO ready for connections`);
    });
}

startServer();

export { io };
