import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './db/prisma';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';

const app = express();

// Middleware
app.use(
    cors({
        origin: env.corsOrigin,
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (_req, res) => {
    res.send({ status: 'ok', env: env.nodeEnv });
});

app.get('/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok' });
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
    app.listen(env.port, () => {
        console.log(`Backend running on http://${env.host}:${env.port} (${env.nodeEnv})`);
    });
}

startServer();
