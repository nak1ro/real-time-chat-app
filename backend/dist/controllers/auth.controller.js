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
exports.logoutUser = exports.refreshToken = exports.getCurrentUser = exports.loginUser = exports.registerUser = void 0;
const authService = __importStar(require("../services/auth.service"));
const middleware_1 = require("../middleware");
// Register a new user
exports.registerUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const dto = req.body;
    const result = await authService.register(dto);
    res.status(201).json({
        status: 'success',
        data: result,
    });
});
// Login user
exports.loginUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const dto = req.body;
    const result = await authService.login(dto);
    res.status(200).json({
        status: 'success',
        data: result,
    });
});
// Get current authenticated user
exports.getCurrentUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const user = await authService.verifyUser(userId);
    const userResponse = authService.mapUserToResponse(user);
    res.status(200).json({
        status: 'success',
        data: { user: userResponse },
    });
});
// Refresh authentication token
exports.refreshToken = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const token = await authService.refreshToken(userId);
    res.status(200).json({
        status: 'success',
        data: { token },
    });
});
// Logout user
exports.logoutUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
    });
});
