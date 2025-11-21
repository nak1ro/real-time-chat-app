"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.userExistsByName = exports.findUserByName = exports.findUserById = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
const middleware_1 = require("../middleware");
// Find user by ID
const findUserById = async (userId, options = {}) => {
    return prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            messages: options.includeMessages ?? false,
            conversations: options.includeConversations ?? false,
            devices: options.includeDevices ?? false,
        },
    });
};
exports.findUserById = findUserById;
// Find user by name
const findUserByName = async (name) => {
    return prisma_1.prisma.user.findFirst({
        where: { name },
    });
};
exports.findUserByName = findUserByName;
// Check if user exists by name
const userExistsByName = async (name) => {
    const user = await prisma_1.prisma.user.findFirst({
        where: { name },
    });
    return user !== null;
};
exports.userExistsByName = userExistsByName;
// Create a new user
const createUser = async (data) => {
    if (await (0, exports.userExistsByName)(data.name)) {
        throw new middleware_1.ConflictError('A user with this name already exists', {
            field: 'name',
        });
    }
    return prisma_1.prisma.user.create({
        data: {
            name: data.name,
            avatarUrl: data.avatarUrl,
            passwordHash: data.passwordHash,
            status: data.status ?? client_1.Status.ONLINE,
            lastSeenAt: new Date(),
        },
    });
};
exports.createUser = createUser;
