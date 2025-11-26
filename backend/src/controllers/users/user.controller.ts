import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as userService from '../../services/users/user.service';

// Get current user
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    const user = await userService.findUserById(userId);

    res.status(200).json({
        status: 'success',
        data: { user },
    });
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await userService.findUserById(id);

    res.status(200).json({
        status: 'success',
        data: { user },
    });
});

// Update current user
export const updateCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { name, avatarUrl } = req.body;

    const user = await userService.updateUser(userId, { name, avatarUrl });

    res.status(200).json({
        status: 'success',
        data: { user },
    });
});

// Search users
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;

    if (typeof query !== 'string') {
        res.status(400).json({
            status: 'error',
            message: 'Query parameter is required',
        });
        return;
    }

    const user = await userService.findUserByName(query);

    res.status(200).json({
        status: 'success',
        data: { users: user ? [user] : [] },
    });
});
