"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.updateCurrentUser = exports.getUserById = exports.getCurrentUser = void 0;
const middleware_1 = require("../../middleware");
const userService = __importStar(require("../../services/users/user.service"));
// Get current user
exports.getCurrentUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const user = await userService.findUserById(userId);
    res.status(200).json({
        status: 'success',
        data: { user },
    });
});
// Get user by ID
exports.getUserById = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await userService.findUserById(id);
    res.status(200).json({
        status: 'success',
        data: { user },
    });
});
// Update current user
exports.updateCurrentUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { name, avatarUrl } = req.body;
    const user = await userService.updateUser(userId, { name, avatarUrl });
    res.status(200).json({
        status: 'success',
        data: { user },
    });
});
// Search users
exports.searchUsers = (0, middleware_1.asyncHandler)(async (req, res) => {
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
