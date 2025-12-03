import dotenv from 'dotenv';
import path from 'path';

const envFile =
    process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env.development';

dotenv.config({path: path.resolve(process.cwd(), envFile)});

function getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key] ?? defaultValue;
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const env = {
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    port: parseInt(getEnvVar('PORT', '3001'), 10),
    host: getEnvVar('HOST', 'localhost'),
    corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim()),
    databaseUrl: getEnvVar('DATABASE_URL'),
    jwtSecret: getEnvVar('JWT_SECRET'),
    jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
    logLevel: getEnvVar('LOG_LEVEL', 'debug'),
};
