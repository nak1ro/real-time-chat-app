"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPasswordHashed = exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const SALT_ROUNDS = 12;
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$.{53}$/;
// Hash a plain text password
const hashPassword = async (password) => {
    return bcrypt_1.default.hash(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
// Compare a plain text password with a hashed password
const comparePassword = async (password, hashedPassword) => {
    return bcrypt_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
// Check if a string is already a bcrypt hash
const isPasswordHashed = (password) => {
    return BCRYPT_HASH_REGEX.test(password);
};
exports.isPasswordHashed = isPasswordHashed;
