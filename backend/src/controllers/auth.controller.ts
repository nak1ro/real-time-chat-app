import { Request, Response } from 'express';
import { RegisterDto, LoginDto } from '../domain';
import * as authService from '../services/auth/auth.service';
import { asyncHandler } from '../middleware';

// Register a new user
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const dto: RegisterDto = req.body;

  const result = await authService.register(dto);

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

// Login user
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const dto: LoginDto = req.body;

  const result = await authService.login(dto);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// Get current authenticated user
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  const user = await authService.verifyUser(userId);
  const userResponse = authService.mapUserToResponse(user);

  res.status(200).json({
    status: 'success',
    data: { user: userResponse },
  });
});

// Refresh authentication token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  const token = await authService.refreshToken(userId);

  res.status(200).json({
    status: 'success',
    data: { token },
  });
});

// Logout user
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});
