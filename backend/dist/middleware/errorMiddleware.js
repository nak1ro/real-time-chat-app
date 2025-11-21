"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSocketError = exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.AttachmentError = exports.ChannelBanError = exports.ModerationError = exports.MembershipError = exports.ConversationError = exports.MessageError = exports.BadRequestError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
const client_1 = require("@prisma/client");
/**
 * Custom Error Classes
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, true, 'VALIDATION_ERROR', details);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, true, 'AUTHENTICATION_ERROR');
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, true, 'AUTHORIZATION_ERROR');
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, true, 'NOT_FOUND');
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message, details) {
        super(message, 409, true, 'CONFLICT_ERROR', details);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, true, 'RATE_LIMIT_ERROR');
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}
exports.RateLimitError = RateLimitError;
class BadRequestError extends AppError {
    constructor(message, details) {
        super(message, 400, true, 'BAD_REQUEST', details);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}
exports.BadRequestError = BadRequestError;
/**
 * Chat-specific Error Classes
 */
class MessageError extends AppError {
    constructor(message, statusCode = 400, details) {
        super(message, statusCode, true, 'MESSAGE_ERROR', details);
        Object.setPrototypeOf(this, MessageError.prototype);
    }
}
exports.MessageError = MessageError;
class ConversationError extends AppError {
    constructor(message, statusCode = 400, details) {
        super(message, statusCode, true, 'CONVERSATION_ERROR', details);
        Object.setPrototypeOf(this, ConversationError.prototype);
    }
}
exports.ConversationError = ConversationError;
class MembershipError extends AppError {
    constructor(message, statusCode = 403, details) {
        super(message, statusCode, true, 'MEMBERSHIP_ERROR', details);
        Object.setPrototypeOf(this, MembershipError.prototype);
    }
}
exports.MembershipError = MembershipError;
class ModerationError extends AppError {
    constructor(message, statusCode = 403, details) {
        super(message, statusCode, true, 'MODERATION_ERROR', details);
        Object.setPrototypeOf(this, ModerationError.prototype);
    }
}
exports.ModerationError = ModerationError;
class ChannelBanError extends AppError {
    constructor(message = 'User is banned from this channel') {
        super(message, 403, true, 'CHANNEL_BAN_ERROR');
        Object.setPrototypeOf(this, ChannelBanError.prototype);
    }
}
exports.ChannelBanError = ChannelBanError;
class AttachmentError extends AppError {
    constructor(message, details) {
        super(message, 400, true, 'ATTACHMENT_ERROR', details);
        Object.setPrototypeOf(this, AttachmentError.prototype);
    }
}
exports.AttachmentError = AttachmentError;
/**
 * Handle Prisma Errors
 */
const handlePrismaError = (error) => {
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                // Unique constraint violation
                const target = error.meta?.target;
                const field = target ? target[0] : 'field';
                return new ConflictError(`A record with this ${field} already exists`, {
                    field,
                    constraint: target,
                });
            case 'P2025':
                // Record not found
                return new NotFoundError('Record');
            case 'P2003':
                // Foreign key constraint violation
                return new BadRequestError('Invalid reference - related record does not exist', {
                    field: error.meta?.field_name,
                });
            case 'P2014':
                // Required relation violation
                return new BadRequestError('Invalid relation', {
                    relation: error.meta?.relation_name,
                });
            case 'P2000':
                // Value too long for column
                return new ValidationError('Value too long', {
                    column: error.meta?.column_name,
                });
            case 'P2001':
                // Record does not exist
                return new NotFoundError('Related record');
            case 'P2015':
                // Related record not found
                return new NotFoundError('Related record');
            case 'P2021':
                // Table does not exist
                return new AppError('Database configuration error', 500, false, 'DB_CONFIG_ERROR');
            case 'P2022':
                // Column does not exist
                return new AppError('Database configuration error', 500, false, 'DB_CONFIG_ERROR');
            default:
                return new AppError('Database operation failed', 500, true, 'DATABASE_ERROR', { code: error.code });
        }
    }
    if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        return new ValidationError('Invalid data provided to database', {
            message: error.message,
        });
    }
    if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
        return new AppError('Failed to initialize database connection', 500, false, 'DB_CONNECTION_ERROR');
    }
    if (error instanceof client_1.Prisma.PrismaClientRustPanicError) {
        return new AppError('Critical database error', 500, false, 'DB_CRITICAL_ERROR');
    }
    return new AppError('An unexpected database error occurred', 500, false);
};
/**
 * Handle Express Validation Errors
 */
const handleValidationError = (error) => {
    return new ValidationError('Validation failed', {
        errors: error.errors || error.array?.(),
    });
};
/**
 * Development Error Response
 */
const sendErrorDev = (err, res) => {
    const response = {
        status: 'error',
        code: err.code,
        message: err.message,
        details: err.details,
        stack: err.stack,
    };
    res.status(err.statusCode).json(response);
};
/**
 * Production Error Response
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        const response = {
            status: 'error',
            code: err.code,
            message: err.message,
            details: err.details,
        };
        res.status(err.statusCode).json(response);
    }
    else {
        // Programming or unknown error: don't leak error details
        console.error('ERROR 💥', err);
        const response = {
            status: 'error',
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong on the server',
        };
        res.status(500).json(response);
    }
};
/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    let error;
    // Convert error to AppError
    if (err instanceof AppError) {
        error = err;
    }
    else if (err.name === 'ValidationError') {
        error = handleValidationError(err);
    }
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError ||
        err instanceof client_1.Prisma.PrismaClientValidationError ||
        err instanceof client_1.Prisma.PrismaClientInitializationError ||
        err instanceof client_1.Prisma.PrismaClientRustPanicError) {
        error = handlePrismaError(err);
    }
    else if (err.name === 'JsonWebTokenError') {
        error = new AuthenticationError('Invalid token');
    }
    else if (err.name === 'TokenExpiredError') {
        error = new AuthenticationError('Token expired');
    }
    else if (err.name === 'MulterError') {
        error = new AttachmentError('File upload error', { message: err.message });
    }
    else if (err.name === 'SyntaxError' && 'body' in err) {
        error = new BadRequestError('Invalid JSON payload');
    }
    else {
        // Unknown error
        error = new AppError(err.message || 'An unexpected error occurred', 500, false, 'UNKNOWN_ERROR');
    }
    // Log error
    if (!error.isOperational || error.statusCode >= 500) {
        console.error('Error Details:', {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            statusCode: error.statusCode,
            message: error.message,
            code: error.code,
            stack: error.stack,
        });
    }
    // Send error response
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    }
    else {
        sendErrorProd(error, res);
    }
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl}`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async Error Wrapper - wraps async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Socket Error Handler
 */
const handleSocketError = (error, socket) => {
    let appError;
    if (error instanceof AppError) {
        appError = error;
    }
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError ||
        error instanceof client_1.Prisma.PrismaClientValidationError) {
        appError = handlePrismaError(error);
    }
    else {
        appError = new AppError(error.message || 'Socket error', 500, false);
    }
    // Emit error to client
    socket.emit('error', {
        code: appError.code,
        message: appError.message,
        details: process.env.NODE_ENV === 'development' ? appError.details : undefined,
    });
    // Log error
    if (!appError.isOperational || appError.statusCode >= 500) {
        console.error('Socket Error:', {
            timestamp: new Date().toISOString(),
            socketId: socket.id,
            message: appError.message,
            code: appError.code,
            stack: appError.stack,
        });
    }
};
exports.handleSocketError = handleSocketError;
