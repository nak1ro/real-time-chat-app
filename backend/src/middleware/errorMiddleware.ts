import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Custom Error Classes
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, true, 'CONFLICT_ERROR', details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'BAD_REQUEST', details);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * Chat-specific Error Classes
 */

export class MessageError extends AppError {
  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message, statusCode, true, 'MESSAGE_ERROR', details);
    Object.setPrototypeOf(this, MessageError.prototype);
  }
}

export class ConversationError extends AppError {
  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message, statusCode, true, 'CONVERSATION_ERROR', details);
    Object.setPrototypeOf(this, ConversationError.prototype);
  }
}

export class MembershipError extends AppError {
  constructor(message: string, statusCode: number = 403, details?: any) {
    super(message, statusCode, true, 'MEMBERSHIP_ERROR', details);
    Object.setPrototypeOf(this, MembershipError.prototype);
  }
}

export class ModerationError extends AppError {
  constructor(message: string, statusCode: number = 403, details?: any) {
    super(message, statusCode, true, 'MODERATION_ERROR', details);
    Object.setPrototypeOf(this, ModerationError.prototype);
  }
}

export class ChannelBanError extends AppError {
  constructor(message: string = 'User is banned from this channel') {
    super(message, 403, true, 'CHANNEL_BAN_ERROR');
    Object.setPrototypeOf(this, ChannelBanError.prototype);
  }
}

export class AttachmentError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'ATTACHMENT_ERROR', details);
    Object.setPrototypeOf(this, AttachmentError.prototype);
  }
}

/**
 * Error Response Interface
 */
interface ErrorResponse {
  status: 'error';
  code?: string;
  message: string;
  details?: any;
  stack?: string;
}

/**
 * Handle Prisma Errors
 */
const handlePrismaError = (error: any): AppError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
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
        return new AppError(
          'Database operation failed',
          500,
          true,
          'DATABASE_ERROR',
          { code: error.code }
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided to database', {
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError(
      'Failed to initialize database connection',
      500,
      false,
      'DB_CONNECTION_ERROR'
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new AppError('Critical database error', 500, false, 'DB_CRITICAL_ERROR');
  }

  return new AppError('An unexpected database error occurred', 500, false);
};

/**
 * Handle Express Validation Errors
 */
const handleValidationError = (error: any): AppError => {
  return new ValidationError('Validation failed', {
    errors: error.errors || error.array?.(),
  });
};

/**
 * Development Error Response
 */
const sendErrorDev = (err: AppError, res: Response): void => {
  const response: ErrorResponse = {
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
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response: ErrorResponse = {
      status: 'error',
      code: err.code,
      message: err.message,
      details: err.details,
    };

    res.status(err.statusCode).json(response);
  } else {
    // Programming or unknown error: don't leak error details
    console.error('ERROR 💥', err);

    const response: ErrorResponse = {
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
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: AppError;

  // Convert error to AppError
  if (err instanceof AppError) {
    error = err;
  } else if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    error = handlePrismaError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  } else if (err.name === 'MulterError') {
    error = new AttachmentError('File upload error', { message: err.message });
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    error = new BadRequestError('Invalid JSON payload');
  } else {
    // Unknown error
    error = new AppError(
      err.message || 'An unexpected error occurred',
      500,
      false,
      'UNKNOWN_ERROR'
    );
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
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

/**
 * Async Error Wrapper - wraps async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Socket Error Handler
 */
export const handleSocketError = (error: Error, socket: any): void => {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    appError = handlePrismaError(error);
  } else {
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

