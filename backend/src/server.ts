import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './db/prisma';

const app = express();

app.use(
    cors({
        origin: env.corsOrigin,
        credentials: true,
    }),
);
app.use(express.json());

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

export function startServer() {
    app.listen(env.port, () => {
        console.log(`Backend running on http://${env.host}:${env.port} (${env.nodeEnv})`);
    });
}
