"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockedUserIds = exports.getBlockedUsers = exports.isUserBlocked = exports.unblockUser = exports.blockUser = void 0;
const prisma_1 = require("../db/prisma");
const middleware_1 = require("../middleware");
// Block a user
const blockUser = async (blockerId, blockedId) => {
    // Prevent self-blocking
    if (blockerId === blockedId) {
        throw new middleware_1.BadRequestError('Cannot block yourself');
    }
    // Verify both users exist
    const [blocker, blocked] = await Promise.all([
        prisma_1.prisma.user.findUnique({ where: { id: blockerId } }),
        prisma_1.prisma.user.findUnique({ where: { id: blockedId } }),
    ]);
    if (!blocker) {
        throw new middleware_1.NotFoundError(`Blocker with ID ${blockerId}`);
    }
    if (!blocked) {
        throw new middleware_1.NotFoundError(`User with ID ${blockedId}`);
    }
    // Check if already blocked
    const existingBlock = await prisma_1.prisma.userBlock.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId,
                blockedId,
            },
        },
    });
    if (existingBlock) {
        throw new middleware_1.BadRequestError('User is already blocked');
    }
    // Create block
    return await prisma_1.prisma.userBlock.create({
        data: {
            blockerId,
            blockedId,
        },
        include: {
            blocked: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
        },
    });
};
exports.blockUser = blockUser;
// Unblock a user
const unblockUser = async (blockerId, blockedId) => {
    // Find existing block
    const block = await prisma_1.prisma.userBlock.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId,
                blockedId,
            },
        },
    });
    if (!block) {
        throw new middleware_1.NotFoundError('User is not blocked');
    }
    // Delete block
    await prisma_1.prisma.userBlock.delete({
        where: {
            id: block.id,
        },
    });
};
exports.unblockUser = unblockUser;
// Check if a user is blocked
const isUserBlocked = async (blockerId, blockedId) => {
    const block = await prisma_1.prisma.userBlock.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId,
                blockedId,
            },
        },
    });
    return !!block;
};
exports.isUserBlocked = isUserBlocked;
// Get all users blocked by a user
const getBlockedUsers = async (userId) => {
    const blocks = await prisma_1.prisma.userBlock.findMany({
        where: {
            blockerId: userId,
        },
        include: {
            blocked: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return blocks;
};
exports.getBlockedUsers = getBlockedUsers;
// Get blocked user IDs for filtering
const getBlockedUserIds = async (userId) => {
    const blocks = await prisma_1.prisma.userBlock.findMany({
        where: {
            blockerId: userId,
        },
        select: {
            blockedId: true,
        },
    });
    return blocks.map((b) => b.blockedId);
};
exports.getBlockedUserIds = getBlockedUserIds;
