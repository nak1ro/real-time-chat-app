'use client';

import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusIconProps {
    status: 'sent' | 'read' | null;
    className?: string;
}

export function MessageStatusIcon({ status, className }: MessageStatusIconProps) {
    if (!status) return null;

    switch (status) {
        case 'sent':
            return <Check className={cn('w-4 h-4 text-muted-foreground/60', className)} />;
        case 'read':
            return <CheckCheck className={cn('w-4 h-4 text-blue-500', className)} />;
        default:
            return null;
    }
}

interface GroupMessageStatusProps {
    readCount: number;
    totalRecipients: number;
    className?: string;
}

export function GroupMessageStatus({
    readCount,
    totalRecipients,
    className,
}: GroupMessageStatusProps) {
    if (totalRecipients === 0) return null;

    return (
        <div className={cn('flex items-center gap-1 text-xs text-muted-foreground/70', className)}>
            {readCount > 0 ? (
                <>
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                    <span>Read by {readCount}</span>
                </>
            ) : (
                <>
                    <Check className="w-3 h-3" />
                    <span>Sent</span>
                </>
            )}
        </div>
    );
}
