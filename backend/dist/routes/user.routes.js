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
const express_1 = require("express");
const userController = __importStar(require("../controllers/users/user.controller"));
const presenceController = __importStar(require("../controllers/users/presence.controller"));
const permissionsController = __importStar(require("../controllers/users/permissions.controller"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(middleware_1.authenticate);
// User routes
router.get('/me', userController.getCurrentUser);
router.patch('/me', userController.updateCurrentUser);
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUserById);
// Presence routes
router.get('/:userId/presence', presenceController.getUserPresence);
router.post('/presence/bulk', presenceController.getBulkPresences);
router.post('/presence/heartbeat', presenceController.updatePresenceHeartbeat);
// Permission routes
router.get('/permissions', permissionsController.checkPermissions);
exports.default = router;
