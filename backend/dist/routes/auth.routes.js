"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Register new user
router.post('/register', controllers_1.authController.registerUser);
// Login
router.post('/login', controllers_1.authController.loginUser);
// Get current user
router.get('/me', middleware_1.authenticate, controllers_1.authController.getCurrentUser);
// Refresh token
router.post('/refresh', middleware_1.authenticate, controllers_1.authController.refreshToken);
// Logout
router.post('/logout', middleware_1.authenticate, controllers_1.authController.logoutUser);
exports.default = router;
