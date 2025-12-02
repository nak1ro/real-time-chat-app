'use client';

import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusIconProps {
  status: 'sent' | 'read' | null;
  className?: string;
}

// Render single status icon
function renderStatusIcon(status: 'sent' | 'read', className?: string) {
  const baseClass = cn('w-4 h-4', className);
  return status === 'sent'
    ? <Check className={cn('text-muted-foreground/60', baseClass)} />
    : <CheckCheck className={cn('text-blue-500', baseClass)} />;
}

export function MessageStatusIcon({
  status,
  className,
}: MessageStatusIconProps) {
  if (!status) return null;
  return renderStatusIcon(status, className);
}

interface GroupMessageStatusProps {
  readCount: number;
  totalRecipients: number;
  className?: string;
}

// Group message status with read count
export function GroupMessageStatus({
  readCount,
  totalRecipients,
  className,
}: GroupMessageStatusProps) {
  if (totalRecipients === 0) return null;

  const hasReads = readCount > 0;
  const icon = hasReads
    ? <CheckCheck className="w-3 h-3 text-blue-500" />
    : <Check className="w-3 h-3" />;
  const text = hasReads ? `Read by ${readCount}` : 'Sent';

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs text-muted-foreground/70',
        className
      )}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}
