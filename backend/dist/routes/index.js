"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const conversation_routes_1 = __importDefault(require("./conversation.routes"));
const message_routes_1 = __importDefault(require("./message.routes"));
const router = (0, express_1.Router)();
// Mount route modules
router.use('/auth', auth_routes_1.default);
router.use('/conversations', conversation_routes_1.default);
router.use('/', message_routes_1.default);
exports.default = router;
