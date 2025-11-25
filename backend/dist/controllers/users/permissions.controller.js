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
exports.checkPermissions = void 0;
const middleware_1 = require("../../middleware");
const permissionsService = __importStar(require("../../services/users/permissions.service"));
// Check user permissions
exports.checkPermissions = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { conversationId, action } = req.query;
    if (typeof conversationId !== 'string') {
        res.status(400).json({
            status: 'error',
            message: 'conversationId is required',
        });
        return;
    }
    let canPerform = false;
    switch (action) {
        case 'sendMessage':
            canPerform = await permissionsService.canSendMessage(userId, conversationId);
            break;
        case 'manageMembers':
            canPerform = await permissionsService.canManageMembers(userId, conversationId);
            break;
        case 'moderateMessage':
            canPerform = await permissionsService.canModerateMessage(userId, conversationId);
            break;
        default:
            res.status(400).json({
                status: 'error',
                message: 'Invalid action',
            });
            return;
    }
    res.status(200).json({
        status: 'success',
        data: { canPerform },
    });
});
