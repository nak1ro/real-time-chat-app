"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSelfOrAdmin = exports.requireUser = exports.optionalAuthenticate = exports.authenticate = void 0;
const services_1 = require("../services");
const services_2 = require("../services");
const errorMiddleware_1 = require("./errorMiddleware");
// Authenticate request using JWT
const authenticate = async (req, res, next) => {
    try {
        const token = (0, services_1.extractTokenFromHeader)(req.headers.authorization);
        if (!token) {
            throw new errorMiddleware_1.AuthenticationError('No authentication token provided');
        }
        const payload = (0, services_1.verifyToken)(token);
        const user = await (0, services_2.findUserById)(payload.userId);
        if (!user) {
            throw new errorMiddleware_1.AuthenticationError('User no longer exists');
        }
        req.user = {
            id: user.id,
            name: user.name,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
// Attach user if token exists, but don't require it
const optionalAuthenticate = async (req, res, next) => {
    try {
        const token = (0, services_1.extractTokenFromHeader)(req.headers.authorization);
        if (token) {
            const payload = (0, services_1.verifyToken)(token);
            const user = await (0, services_2.findUserById)(payload.userId);
            if (user) {
                req.user = {
                    id: user.id,
                    name: user.name,
                };
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
// Ensure user is authenticated
const requireUser = (req, res, next) => {
    if (!req.user) {
        throw new errorMiddleware_1.AuthenticationError('Authentication required');
    }
    next();
};
exports.requireUser = requireUser;
// Allow only the user themselves (or an admin, in future)
const requireSelfOrAdmin = (req, res, next) => {
    const userId = req.params.userId || req.params.id;
    const currentUserId = req.user?.id;
    if (!currentUserId) {
        throw new errorMiddleware_1.AuthenticationError('Authentication required');
    }
    if (userId !== currentUserId) {
        throw new errorMiddleware_1.AuthorizationError('You can only access your own data');
    }
    next();
};
exports.requireSelfOrAdmin = requireSelfOrAdmin;
