import { User } from '@prisma/client';
import { prisma } from '../db/prisma';
import { RegisterDto, LoginDto, AuthResponse, UserResponse } from '../domain';
import { validateOrThrow, validateRegistration, validateLogin } from '../utils';
import { hashPassword, comparePassword } from './password.service';
import { generateToken } from './token.service';
import { 
  createUser, 
  findUserByName as findUserByNameService, 
  findUserById 
} from './user.service';
import { 
  AuthenticationError, 
  ConflictError,
  NotFoundError 
} from '../middleware';

/**
 * Map User entity to UserResponse DTO
 */
export const mapUserToResponse = (user: User): UserResponse => {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    status: user.status,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
  };
};

/**
 * Register a new user
 * For guest users (no password): Just create with name
 * For authenticated users: Create with name and password hash
 */
export const register = async (dto: RegisterDto): Promise<AuthResponse> => {
  // Validate input
  validateOrThrow(
    () => validateRegistration(dto),
    'Registration validation failed'
  );

  // Check if user with this name already exists
  const existingUser = await findUserByNameService(dto.name);
  if (existingUser) {
    throw new ConflictError('A user with this name already exists', {
      field: 'name',
    });
  }

  let passwordHash: string | undefined;
  if (dto.password) {
    passwordHash = await hashPassword(dto.password);
  }

  // Create user
  const user = await createUser({
    name: dto.name,
    avatarUrl: dto.avatarUrl,
    passwordHash, // Note: This field doesn't exist in current schema
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    name: user.name,
  });

  return {
    user: mapUserToResponse(user),
    token,
  };
};

/**
 * Login user with email and password
 * Note: Current schema doesn't have email/password fields
 * This is a placeholder for when you add authentication fields
 */
export const login = async (dto: LoginDto): Promise<AuthResponse> => {
  // Validate input
  validateOrThrow(
    () => validateLogin(dto),
    'Login validation failed'
  );

  // Find user by email (using name for now)
  const user = await findUserByNameService(dto.email);
  
  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Verify password
  // Note: passwordHash field doesn't exist in current schema
  // You'll need to add this field to the User model
  // For now, we'll throw an error
  throw new AuthenticationError('Password authentication not yet implemented');

  /*
  // This is what the implementation would look like with password field:
  if (!user.passwordHash) {
    throw new AuthenticationError('Invalid credentials');
  }

  const isPasswordValid = await comparePassword(dto.password, user.passwordHash);
  
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    name: user.name,
  });

  return {
    user: mapUserToResponse(user),
    token,
  };
  */
};

/**
 * Verify user authentication and return user
 */
export const verifyUser = async (userId: string): Promise<User> => {
  const user = await findUserById(userId);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  return user;
};

/**
 * Refresh token for a user
 */
export const refreshToken = async (userId: string): Promise<string> => {
  const user = await verifyUser(userId);
  
  return generateToken({
    userId: user.id,
    name: user.name,
  });
};

