"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = void 0;
/**
 * Type Guards
 */
const isUser = (obj) => {
    return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};
exports.isUser = isUser;
