'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { UploadedAttachment } from '@/types';
import { AttachmentType } from '@/types';
import {formatFileSize, getAttachmentIcon} from "@/lib/utils/attachmentUtils";

interface AttachmentPreviewProps {
    attachments: UploadedAttachment[];
    onRemove: (index: number) => void;
    className?: string;
}

interface AttachmentItemProps {
    attachment: UploadedAttachment;
    onRemove: () => void;
}

// Renders the icon or thumbnail for an attachment
function AttachmentThumbnail({ attachment }: { attachment: UploadedAttachment }) {
    const Icon = getAttachmentIcon(attachment.type);
    const isImage = attachment.type === AttachmentType.IMAGE;

    if (isImage && attachment.url) {
        return (
            <img
                src={attachment.url}
                alt={attachment.fileName}
                className="w-12 h-12 object-cover rounded border border-border"
            />
        );
    }

    return (
        <div className="w-12 h-12 flex items-center justify-center rounded bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
    );
}

// Renders file name and size information
function AttachmentFileInfo({ attachment }: { attachment: UploadedAttachment }) {
    return (
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-card-foreground">
                {attachment.fileName}
            </p>
            <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.sizeBytes)}
            </p>
        </div>
    );
}

// Component for a single attachment preview item with a remove button
function AttachmentPreviewItem({ attachment, onRemove }: AttachmentItemProps) {
    return (
        <div
            className={cn(
                'relative group flex items-center gap-2 rounded-lg p-2 pr-8 max-w-xs',
                'bg-card border border-border shadow-sm'
            )}
        >
            <AttachmentThumbnail attachment={attachment} />
            <AttachmentFileInfo attachment={attachment} />

            {/* Remove button */}
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    'absolute top-1 right-1 h-6 w-6',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'hover:bg-destructive/15 hover:text-destructive'
                )}
                onClick={onRemove}
            >
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}

// Main component to display a list of attachment previews
export function AttachmentPreview({ attachments, onRemove, className }: AttachmentPreviewProps) {
    if (attachments.length === 0) return null;

    return (
        <div className={cn(
            'flex flex-wrap gap-2 p-2 rounded-lg',
            'bg-secondary/50 border border-border',
            className
        )}>
            {attachments.map((attachment, index) => (
                <AttachmentPreviewItem
                    key={index}
                    attachment={attachment}
                    onRemove={() => onRemove(index)}
                />
            ))}
        </div>
    );
}