import { User, Status } from '@prisma/client';
import { prisma } from '../db/prisma';
import { CreateUserData, UserQueryOptions } from '../domain';
import { ConflictError } from '../middleware';

// Find user by ID
export const findUserById = async (
    userId: string,
    options: UserQueryOptions = {}
): Promise<User | null> => {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            messages: options.includeMessages ?? false,
            conversations: options.includeConversations ?? false,
            devices: options.includeDevices ?? false,
        },
    });
};

// Find user by name
export const findUserByName = async (name: string): Promise<User | null> => {
    return prisma.user.findFirst({
        where: { name },
    });
};

// Check if user exists by name
export const userExistsByName = async (name: string): Promise<boolean> => {
    const user = await prisma.user.findFirst({
        where: { name },
    });
    return user !== null;
};

// Create a new user
export const createUser = async (data: CreateUserData): Promise<User> => {
    if (await userExistsByName(data.name)) {
        throw new ConflictError('A user with this name already exists', {
            field: 'name',
        });
    }

    return prisma.user.create({
        data: {
            name: data.name,
            avatarUrl: data.avatarUrl,
            passwordHash: data.passwordHash,
            status: data.status ?? Status.ONLINE,
            lastSeenAt: new Date(),
        },
    });
};
