import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as authService from '../../services/auth/auth.service';
import { RegisterDto, LoginDto } from '../../domain';

// Register new user
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const dto: RegisterDto = req.body;

    const authResponse = await authService.register(dto);

    res.status(201).json({
        status: 'success',
        data: authResponse,
    });
});

// Login user
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const dto: LoginDto = req.body;

    const authResponse = await authService.login(dto);

    res.status(200).json({
        status: 'success',
        data: authResponse,
    });
});

// Get current authenticated user
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    const user = await authService.verifyUser(userId);

    res.status(200).json({
        status: 'success',
        data: {
            user: authService.mapUserToResponse(user),
        },
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

// Logout user (placeholder)
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    // Since we're using stateless JWT tokens, logout is handled client-side
    // by removing the token. This endpoint can be used for additional
    // cleanup if needed (e.g., token blacklisting, logging, etc.)

    res.status(200).json({
        status: 'success',
        data: {
            message: 'Logged out successfully',
        },
    });
});
