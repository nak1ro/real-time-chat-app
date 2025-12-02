'use client';

import { Download, File, FileText, Music, Video, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Attachment } from '@/types';
import { AttachmentType } from '@/types';
import { useState, useEffect } from 'react';

interface MessageAttachmentsProps {
    attachments: Attachment[];
    className?: string;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getAttachmentIcon(type: AttachmentType) {
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

function ImageAttachment({ attachment }: { attachment: Attachment }) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Close lightbox on escape key
    useEffect(() => {
        if (!isLightboxOpen) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsLightboxOpen(false);
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen]);

    return (
        <>
            <div
                className={cn(
                    'relative cursor-pointer group overflow-hidden rounded-lg',
                    'border border-border'
                )}
                onClick={() => setIsLightboxOpen(true)}
            >
                <img
                    src={attachment.url}
                    alt={attachment.fileName}
                    className="max-w-full h-auto max-h-96 object-contain bg-muted"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors" />
            </div>

            {/* Lightbox - uses fixed colors since it's an overlay */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    {/* Close button */}
                    <button
                        className={cn(
                            'absolute top-4 right-4 p-2 rounded-full',
                            'bg-muted hover:bg-accent',
                            'text-foreground transition-colors'
                        )}
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    
                    <img
                        src={attachment.url}
                        alt={attachment.fileName}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* File name */}
                    <div className={cn(
                        'absolute bottom-4 left-1/2 -translate-x-1/2',
                        'px-4 py-2 rounded-full',
                        'bg-popover text-popover-foreground text-sm',
                        'border border-border shadow-lg'
                    )}>
                        {attachment.fileName}
                    </div>
                </div>
            )}
        </>
    );
}

function VideoAttachment({ attachment }: { attachment: Attachment }) {
    return (
        <video
            controls
            className="max-w-full h-auto max-h-96 rounded-lg bg-muted border border-border"
            preload="metadata"
        >
            <source src={attachment.url} type={attachment.mimeType} />
            Your browser does not support the video tag.
        </video>
    );
}

function AudioAttachment({ attachment }: { attachment: Attachment }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/15">
                <Music className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                    {attachment.fileName}
                </p>
                <audio controls className="w-full mt-2 h-8">
                    <source src={attachment.url} type={attachment.mimeType} />
                    Your browser does not support the audio tag.
                </audio>
            </div>
        </div>
    );
}

function DocumentAttachment({ attachment }: { attachment: Attachment }) {
    const Icon = getAttachmentIcon(attachment.type);

    return (
        <a
            href={attachment.url}
            download={attachment.fileName}
            className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-all group',
                'bg-secondary hover:bg-accent',
                'border border-border hover:border-primary/30'
            )}
        >
            <div className={cn(
                'w-10 h-10 flex items-center justify-center rounded-lg',
                'bg-card border border-border',
                'group-hover:border-primary/50 transition-colors'
            )}>
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                    {attachment.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.sizeBytes)}
                </p>
            </div>
            <Download className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>
    );
}

export function MessageAttachments({ attachments, className }: MessageAttachmentsProps) {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className={cn('flex flex-col gap-2 mt-2', className)}>
            {attachments.map((attachment) => {
                switch (attachment.type) {
                    case AttachmentType.IMAGE:
                        return <ImageAttachment key={attachment.id} attachment={attachment} />;
                    case AttachmentType.VIDEO:
                        return <VideoAttachment key={attachment.id} attachment={attachment} />;
                    case AttachmentType.AUDIO:
                        return <AudioAttachment key={attachment.id} attachment={attachment} />;
                    case AttachmentType.DOCUMENT:
                    default:
                        return <DocumentAttachment key={attachment.id} attachment={attachment} />;
                }
            })}
        </div>
    );
}
