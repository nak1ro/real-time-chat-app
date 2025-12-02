'use client';

import { X, File, FileText, Music, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { UploadedAttachment } from '@/types';
import { AttachmentType } from '@/types';

interface AttachmentPreviewProps {
    attachments: UploadedAttachment[];
    onRemove: (index: number) => void;
    className?: string;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getAttachmentIcon(type: string) {
    switch (type) {
        case AttachmentType.IMAGE:
            return ImageIcon;
        case AttachmentType.VIDEO:
            return Video;
        case AttachmentType.AUDIO:
            return Music;
        case AttachmentType.DOCUMENT:
            return FileText;
        default:
            return File;
    }
}

export function AttachmentPreview({ attachments, onRemove, className }: AttachmentPreviewProps) {
    if (attachments.length === 0) return null;

    return (
        <div className={cn(
            'flex flex-wrap gap-2 p-2 rounded-lg',
            'bg-secondary/50 border border-border',
            className
        )}>
            {attachments.map((attachment, index) => {
                const Icon = getAttachmentIcon(attachment.type);
                const isImage = attachment.type === AttachmentType.IMAGE;

                return (
                    <div
                        key={index}
                        className={cn(
                            'relative group flex items-center gap-2 rounded-lg p-2 pr-8 max-w-xs',
                            'bg-card border border-border shadow-sm'
                        )}
                    >
                        {/* Thumbnail or icon */}
                        {isImage && attachment.url ? (
                            <img
                                src={attachment.url}
                                alt={attachment.fileName}
                                className="w-12 h-12 object-cover rounded border border-border"
                            />
                        ) : (
                            <div className="w-12 h-12 flex items-center justify-center rounded bg-muted">
                                <Icon className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-card-foreground">
                                {attachment.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.sizeBytes)}
                            </p>
                        </div>

                        {/* Remove button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'absolute top-1 right-1 h-6 w-6',
                                'opacity-0 group-hover:opacity-100 transition-opacity',
                                'hover:bg-destructive/15 hover:text-destructive'
                            )}
                            onClick={() => onRemove(index)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}
