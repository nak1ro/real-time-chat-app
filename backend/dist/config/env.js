"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), envFile) });
function getEnvVar(key, defaultValue) {
    const value = process.env[key] ?? defaultValue;
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
exports.env = {
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    port: parseInt(getEnvVar('PORT', '3001'), 10),
    host: getEnvVar('HOST', 'localhost'),
    corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
    databaseUrl: getEnvVar('DATABASE_URL'),
    jwtSecret: getEnvVar('JWT_SECRET'),
    jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
    logLevel: getEnvVar('LOG_LEVEL', 'debug'),
};
