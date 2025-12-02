import { Message, MessageReceipt } from '@/types';
import { MessageDeliveryStatus } from '@/types/enums';

// Check if message should be marked as delivered
export function shouldMarkAsDelivered(
    message: Message,
    currentUserId: string
): boolean {
    // Don't mark own messages
    if (message.userId === currentUserId) return false;

    // Check if already delivered or read
    const myReceipt = message.receipts?.find((r) => r.userId === currentUserId);
    if (
        myReceipt?.status === MessageDeliveryStatus.DELIVERED ||
        myReceipt?.status === MessageDeliveryStatus.READ
    ) {
        return false;
    }

    return true;
}

// Check if message should be marked as read
export function shouldMarkAsRead(
    message: Message,
    currentUserId: string,
    pendingReadIds: Set<string>
): boolean {
    // Don't mark own messages as read
    if (message.userId === currentUserId) return false;

    // Check if already read by current user
    const myReceipt = message.receipts?.find((r) => r.userId === currentUserId);
    if (myReceipt?.status === MessageDeliveryStatus.READ) return false;

    // Check if already in pending queue
    if (pendingReadIds.has(message.id)) return false;

    return true;
}

// Get message status for current user (for UI display)
export function getMessageStatus(
    message: Message,
    currentUserId: string
): 'sent' | 'delivered' | 'read' | null {
    // Only show status for messages sent by current user
    if (message.userId !== currentUserId) {
        return null;
    }

    const receipts = message.receipts || [];

    // Check for read status first (highest priority)
    if (receipts.some((r) => r.status === MessageDeliveryStatus.READ)) {
        return 'read';
    }

    // Then check delivered
    if (receipts.some((r) => r.status === MessageDeliveryStatus.DELIVERED)) {
        return 'delivered';
    }

    // Default to sent
    return 'sent';
}

// Get group message receipt stats
export function getGroupMessageStats(message: Message): {
    deliveredCount: number;
    readCount: number;
    totalRecipients: number;
} {
    const receipts = message.receipts || [];

    const deliveredCount = receipts.filter(
        (r) =>
            r.status === MessageDeliveryStatus.DELIVERED ||
            r.status === MessageDeliveryStatus.READ
    ).length;

    const readCount = receipts.filter(
        (r) => r.status === MessageDeliveryStatus.READ
    ).length;

    // Total recipients is total number of receipts
    const totalRecipients = receipts.length;

    return { deliveredCount, readCount, totalRecipients };
}

// Update message receipts in cache with new receipt data
export function updateMessageReceipt(
    message: Message,
    userId: string,
    status: MessageDeliveryStatus,
    timestamp: Date
): Message {
    const receipts = message.receipts || [];
    const existingReceiptIndex = receipts.findIndex((r) => r.userId === userId);

    let updatedReceipts: MessageReceipt[];

    if (existingReceiptIndex >= 0) {
        // Update existing receipt
        updatedReceipts = receipts.map((r, index) =>
            index === existingReceiptIndex
                ? {
                    ...r,
                    status,
                    deliveredAt:
                        status === MessageDeliveryStatus.DELIVERED ? timestamp : r.deliveredAt,
                    seenAt: status === MessageDeliveryStatus.READ ? timestamp : r.seenAt,
                    updatedAt: timestamp,
                }
                : r
        );
    } else {
        // Add new receipt
        updatedReceipts = [
            ...receipts,
            {
                id: `temp-${Date.now()}`, // Temporary ID
                messageId: message.id,
                userId,
                status,
                deliveredAt: status === MessageDeliveryStatus.DELIVERED ? timestamp : null,
                seenAt: status === MessageDeliveryStatus.READ ? timestamp : null,
                createdAt: timestamp,
                updatedAt: timestamp,
            },
        ];
    }

    return {
        ...message,
        receipts: updatedReceipts,
    };
}

// Update multiple message receipts for bulk read operation
export function updateBulkMessageReceipts(
    messages: Message[],
    messageIds: string[],
    userId: string,
    timestamp: Date
): Message[] {
    return messages.map((msg) => {
        if (!messageIds.includes(msg.id)) return msg;
        return updateMessageReceipt(msg, userId, MessageDeliveryStatus.READ, timestamp);
    });
}
