"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReceiptTimestamps = exports.DELETED_MESSAGE_PLACEHOLDER = exports.MAX_PAGE_LIMIT = exports.DEFAULT_PAGE_LIMIT = exports.RECEIPT_INCLUDE_WITH_USER = exports.MEMBER_INCLUDE_WITH_USER = exports.MESSAGE_INCLUDE_WITH_RELATIONS = exports.MESSAGE_REPLY_TO_INCLUDE = exports.MESSAGE_USER_SELECT = exports.USER_SELECT = void 0;
const client_1 = require("@prisma/client");
// Shared Prisma select and include configurations used across services
// User selections
exports.USER_SELECT = {
    id: true,
    name: true,
    avatarUrl: true,
};
exports.MESSAGE_USER_SELECT = {
    id: true,
    name: true,
    avatarUrl: true,
    status: true,
};
// Message includes
exports.MESSAGE_REPLY_TO_INCLUDE = {
    select: {
        id: true,
        text: true,
        userId: true,
        createdAt: true,
        user: {
            select: {
                id: true,
                name: true,
                avatarUrl: true,
            },
        },
    },
};
exports.MESSAGE_INCLUDE_WITH_RELATIONS = {
    user: { select: exports.MESSAGE_USER_SELECT },
    replyTo: exports.MESSAGE_REPLY_TO_INCLUDE,
    attachments: true,
    _count: {
        select: { receipts: true },
    },
};
// Member includes
exports.MEMBER_INCLUDE_WITH_USER = {
    members: {
        include: {
            user: true,
        },
    },
};
// Receipt includes
exports.RECEIPT_INCLUDE_WITH_USER = {
    user: {
        select: exports.USER_SELECT,
    },
};
// Message constants
exports.DEFAULT_PAGE_LIMIT = 50;
exports.MAX_PAGE_LIMIT = 100;
exports.DELETED_MESSAGE_PLACEHOLDER = '[Message deleted]';
// Receipt helpers
// Build receipt timestamp data based on status
const buildReceiptTimestamps = (status) => {
    const now = new Date();
    if (status === client_1.MessageDeliveryStatus.READ) {
        return { deliveredAt: now, seenAt: now };
    }
    if (status === client_1.MessageDeliveryStatus.DELIVERED) {
        return { deliveredAt: now };
    }
    return {};
};
exports.buildReceiptTimestamps = buildReceiptTimestamps;
