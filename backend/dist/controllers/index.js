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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
// Auth controllers
const authControllerImport = __importStar(require("./auth/auth.controller"));
exports.authController = authControllerImport;
// Message controllers
__exportStar(require("./messages/message.controller"), exports);
__exportStar(require("./messages/mention.controller"), exports);
__exportStar(require("./messages/reaction.controller"), exports);
__exportStar(require("./messages/receipt.controller"), exports);
__exportStar(require("./messages/attachment.controller"), exports);
__exportStar(require("./messages/notification.controller"), exports);
// Conversation controllers
__exportStar(require("./conversations/conversation.controller"), exports);
__exportStar(require("./conversations/moderation.controller"), exports);
// User controllers
__exportStar(require("./users/user.controller"), exports);
__exportStar(require("./users/presence.controller"), exports);
__exportStar(require("./users/permissions.controller"), exports);
