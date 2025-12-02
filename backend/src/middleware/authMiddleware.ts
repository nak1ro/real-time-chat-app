import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../services';
import { findUserById } from '../services';
import { AuthenticationError, AuthorizationError } from './errorMiddleware';
import { TokenPayload } from '../domain';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
      };
    }
  }
}

// Authenticate request using JWT
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const payload: TokenPayload = verifyToken(token);
    const user = await findUserById(payload.userId);

    if (!user) {
      throw new AuthenticationError('User no longer exists');
    }

    req.user = {
      id: user.id,
      name: user.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Attach user if token exists, but don't require it
export const optionalAuthenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload: TokenPayload = verifyToken(token);
      const user = await findUserById(payload.userId);

      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
        };
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Ensure user is authenticated
export const requireUser = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  next();
};

// Allow only the user themselves (or an admin, in future)
export const requireSelfOrAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
  const userId = req.params.userId || req.params.id;
  const currentUserId = req.user?.id;

  if (!currentUserId) {
    throw new AuthenticationError('Authentication required');
  }

  if (userId !== currentUserId) {
    throw new AuthorizationError('You can only access your own data');
  }

  next();
};
