import { MessageDeliveryStatus } from '@prisma/client';

// Shared Prisma select and include configurations used across services

// User selections

export const USER_SELECT = {
    id: true,
    name: true,
    avatarUrl: true,
} as const;

export const MESSAGE_USER_SELECT = {
    id: true,
    name: true,
    avatarUrl: true,
    status: true,
} as const;

// Message includes

export const MESSAGE_REPLY_TO_INCLUDE = {
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
} as const;

export const MESSAGE_INCLUDE_WITH_RELATIONS = {
    user: { select: MESSAGE_USER_SELECT },
    replyTo: MESSAGE_REPLY_TO_INCLUDE,
    attachments: true,
    mentions: true,
    _count: {
        select: { receipts: true },
    },
} as const;

// Member includes

export const MEMBER_INCLUDE_WITH_USER = {
    members: {
        include: {
            user: true,
        },
    },
} as const;

// Receipt includes

export const RECEIPT_INCLUDE_WITH_USER = {
    user: {
        select: USER_SELECT,
    },
} as const;

// Message constants

export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 100;
export const DELETED_MESSAGE_PLACEHOLDER = '[Message deleted]';

// Receipt helpers

// Build receipt timestamp data based on status
export const buildReceiptTimestamps = (status: MessageDeliveryStatus): {
    deliveredAt?: Date;
    seenAt?: Date;
} => {
    const now = new Date();

    if (status === MessageDeliveryStatus.READ) {
        return { deliveredAt: now, seenAt: now };
    }

    if (status === MessageDeliveryStatus.DELIVERED) {
        return { deliveredAt: now };
    }

    return {};
};
