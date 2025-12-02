'use client';

import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusIconProps {
    status: 'sent' | 'delivered' | 'read' | null;
    className?: string;
}

export function MessageStatusIcon({ status, className }: MessageStatusIconProps) {
    if (!status) return null;

    switch (status) {
        case 'sent':
            return <Check className={cn('w-4 h-4 text-muted-foreground/60', className)} />;
        case 'delivered':
            return <CheckCheck className={cn('w-4 h-4 text-muted-foreground/60', className)} />;
        case 'read':
            return <CheckCheck className={cn('w-4 h-4 text-blue-500', className)} />;
    }
}

interface GroupMessageStatusProps {
    deliveredCount: number;
    readCount: number;
    totalRecipients: number;
    className?: string;
}

export function GroupMessageStatus({
    deliveredCount,
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
            ) : deliveredCount > 0 ? (
                <>
                    <CheckCheck className="w-3 h-3" />
                    <span>
                        Delivered to {deliveredCount}
                        {totalRecipients > 1 && ` of ${totalRecipients}`}
                    </span>
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
