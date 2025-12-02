import { Message, MessageReceipt } from '@/types';
import { MessageDeliveryStatus } from '@/types/enums';

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
): 'sent' | 'read' | null {
    // Only show status for messages sent by current user
    if (message.userId !== currentUserId) {
        return null;
    }

    const receipts = message.receipts || [];

    // Check for read status
    if (receipts.some((r) => r.status === MessageDeliveryStatus.READ)) {
        return 'read';
    }

    // Default to sent
    return 'sent';
}

// Get group message receipt stats
export function getGroupMessageStats(message: Message): {
    readCount: number;
    totalRecipients: number;
} {
    const receipts = message.receipts || [];

    const readCount = receipts.filter(
        (r) => r.status === MessageDeliveryStatus.READ
    ).length;

    // Total recipients is total number of receipts
    const totalRecipients = receipts.length;

    return { readCount, totalRecipients };
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

// Frontend validation: Check if should emit read receipt
export function shouldEmitRead(
    message: Message,
    currentUserId: string
): boolean {
    // Don't emit for own messages
    if (message.userId === currentUserId) return false;

    const myReceipt = message.receipts?.find((r) => r.userId === currentUserId);

    // Don't emit if already read
    return myReceipt?.status !== MessageDeliveryStatus.READ;
}
