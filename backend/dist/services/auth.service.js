"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.verifyUser = exports.login = exports.register = exports.mapUserToResponse = void 0;
const utils_1 = require("../utils");
const password_service_1 = require("./password.service");
const token_service_1 = require("./token.service");
const user_service_1 = require("./user.service");
const middleware_1 = require("../middleware");
/**
 * Map User entity to UserResponse DTO
 */
const mapUserToResponse = (user) => {
    return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        status: user.status,
        lastSeenAt: user.lastSeenAt,
        createdAt: user.createdAt,
    };
};
exports.mapUserToResponse = mapUserToResponse;
/**
 * Register a new user with name and password
 */
const register = async (dto) => {
    // Validate input
    (0, utils_1.validateOrThrow)(() => (0, utils_1.validateRegistration)(dto), 'Registration validation failed');
    // Check if user with this name already exists
    const existingUser = await (0, user_service_1.findUserByName)(dto.name);
    if (existingUser) {
        throw new middleware_1.ConflictError('A user with this name already exists', {
            field: 'name',
        });
    }
    // Hash password
    const passwordHash = await (0, password_service_1.hashPassword)(dto.password);
    // Create user
    const user = await (0, user_service_1.createUser)({
        name: dto.name,
        avatarUrl: dto.avatarUrl,
        passwordHash,
    });
    // Generate token
    const token = (0, token_service_1.generateToken)({
        userId: user.id,
        name: user.name,
    });
    return {
        user: (0, exports.mapUserToResponse)(user),
        token,
    };
};
exports.register = register;
/**
 * Login user with name and password
 */
const login = async (dto) => {
    // Validate input
    (0, utils_1.validateOrThrow)(() => (0, utils_1.validateLogin)(dto), 'Login validation failed');
    // Find user by name
    const user = await (0, user_service_1.findUserByName)(dto.name);
    if (!user) {
        throw new middleware_1.AuthenticationError('Invalid credentials');
    }
    // Check if user has a password set
    if (!user.passwordHash) {
        throw new middleware_1.AuthenticationError('Invalid credentials');
    }
    // Verify password
    const isPasswordValid = await (0, password_service_1.comparePassword)(dto.password, user.passwordHash);
    if (!isPasswordValid) {
        throw new middleware_1.AuthenticationError('Invalid credentials');
    }
    // Generate token
    const token = (0, token_service_1.generateToken)({
        userId: user.id,
        name: user.name,
    });
    return {
        user: (0, exports.mapUserToResponse)(user),
        token,
    };
};
exports.login = login;
/**
 * Verify user authentication and return user
 */
const verifyUser = async (userId) => {
    const user = await (0, user_service_1.findUserById)(userId);
    if (!user) {
        throw new middleware_1.NotFoundError('User');
    }
    return user;
};
exports.verifyUser = verifyUser;
/**
 * Refresh token for a user
 */
const refreshToken = async (userId) => {
    const user = await (0, exports.verifyUser)(userId);
    return (0, token_service_1.generateToken)({
        userId: user.id,
        name: user.name,
    });
};
exports.refreshToken = refreshToken;
