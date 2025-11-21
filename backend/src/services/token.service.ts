import jwt, {Secret, SignOptions} from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload } from '../domain';
import { AuthenticationError } from '../middleware';

// Generate JWT token
export const generateToken = (payload: TokenPayload): string => {
  const secret: Secret = env.jwtSecret as Secret;
  const expiresIn: SignOptions['expiresIn'] =
      env.jwtExpiresIn as SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
};

// Verify and decode JWT token
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError('Token verification failed');
  }
};

// Decode token without verification
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};
