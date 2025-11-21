"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = exports.sanitizeString = exports.validateOrThrow = exports.validateLogin = exports.validateRegistration = exports.isValidUrl = exports.isValidName = exports.isValidPassword = void 0;
const errorMiddleware_1 = require("../middleware/errorMiddleware");
/**
 * Password Validation
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const isValidPassword = (password) => {
    if (password.length < 8)
        return false;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber;
};
exports.isValidPassword = isValidPassword;
/**
 * Name Validation
 * - Minimum 2 characters
 * - Maximum 50 characters
 * - Only letters, numbers, spaces, hyphens, and underscores
 */
const isValidName = (name) => {
    if (name.length < 2 || name.length > 50)
        return false;
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    return nameRegex.test(name.trim());
};
exports.isValidName = isValidName;
/**
 * URL Validation
 */
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
/**
 * Validate Registration Data
 */
const validateRegistration = (data) => {
    const errors = {};
    // Validate name (required)
    if (!data.name || !data.name.trim()) {
        errors.name = 'Name is required';
    }
    else if (!(0, exports.isValidName)(data.name)) {
        errors.name = 'Name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and underscores';
    }
    // Validate password (required)
    if (!data.password || !data.password.trim()) {
        errors.password = 'Password is required';
    }
    else if (!(0, exports.isValidPassword)(data.password)) {
        errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
    // Validate avatarUrl (optional)
    if (data.avatarUrl && !(0, exports.isValidUrl)(data.avatarUrl)) {
        errors.avatarUrl = 'Invalid avatar URL format';
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
exports.validateRegistration = validateRegistration;
/**
 * Validate Login Data
 */
const validateLogin = (data) => {
    const errors = {};
    if (!data.name || !data.name.trim()) {
        errors.name = 'Name is required';
    }
    else if (!(0, exports.isValidName)(data.name)) {
        errors.name = 'Invalid name format';
    }
    if (!data.password || !data.password.trim()) {
        errors.password = 'Password is required';
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
exports.validateLogin = validateLogin;
/**
 * Validate and Throw on Error
 */
const validateOrThrow = (validationFn, customMessage) => {
    const result = validationFn();
    if (!result.isValid) {
        throw new errorMiddleware_1.ValidationError(customMessage || 'Validation failed', result.errors);
    }
};
exports.validateOrThrow = validateOrThrow;
/**
 * Sanitize String Input
 */
const sanitizeString = (input) => {
    return input.trim().replace(/\s+/g, ' ');
};
exports.sanitizeString = sanitizeString;
/**
 * Check if String is Empty or Whitespace
 */
const isEmpty = (str) => {
    return !str || str.trim().length === 0;
};
exports.isEmpty = isEmpty;
