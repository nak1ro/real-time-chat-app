import {File, FileText, Music, Video, Image as ImageIcon} from 'lucide-react';
import {AttachmentType} from "@/types";

// Converts bytes to a human-readable string (B, KB, MB)
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getAttachmentIcon(type: string | AttachmentType) {
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