import { User } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { RegisterDto, LoginDto, AuthResponse, UserResponse } from '../../domain';
import { validateOrThrow, validateRegistration, validateLogin } from '../../utils';
import { hashPassword, comparePassword } from './password.service';
import { generateToken } from './token.service';
import {
  createUser,
  findUserByName as findUserByNameService,
  findUserById
} from '../users/user.service';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError
} from '../../middleware';
import { verifyUserExists } from '../../utils/validation-helpers';

// Map User entity to UserResponse DTO
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

// Register a new user with name and password
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

  // Hash password
  const passwordHash = await hashPassword(dto.password);

  // Create user
  const user = await createUser({
    name: dto.name,
    avatarUrl: dto.avatarUrl,
    passwordHash,
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

// Login user with name and password
export const login = async (dto: LoginDto): Promise<AuthResponse> => {
  // Validate input
  validateOrThrow(
    () => validateLogin(dto),
    'Login validation failed'
  );

  // Find user by name
  const user = await findUserByNameService(dto.name);

  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if user has a password set
  if (!user.passwordHash) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Verify password
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
};

// Verify user authentication and return user
export const verifyUser = async (userId: string): Promise<User> => {
  return verifyUserExists(userId);
};

// Refresh token for a user
export const refreshToken = async (userId: string): Promise<string> => {
  const user = await verifyUser(userId);

  return generateToken({
    userId: user.id,
    name: user.name,
  });
};




