"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredModerations = void 0;
const prisma_1 = require("../db/prisma");
// Clean up expired channel bans and moderation actions
const cleanupExpiredModerations = async () => {
    const now = new Date();
    // Delete expired channel bans
    const deletedBans = await prisma_1.prisma.channelBan.deleteMany({
        where: {
            expiresAt: {
                lte: now,
            },
        },
    });
    console.log(`Cleaned up ${deletedBans.count} expired channel bans`);
    // Note: ModerationAction records are kept for historical purposes
    // Active mute checking already filters by expiresAt
};
exports.cleanupExpiredModerations = cleanupExpiredModerations;
