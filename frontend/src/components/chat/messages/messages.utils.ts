// Format time for message display
export const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
};

// Extract initials from name
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Truncate text to specified length
export const truncateText = (text: string, maxLength: number = 80): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Format date for file display
export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

// Get file icon emoji based on MIME type
export const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
        return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('csv')) return '📈';
    return '📎';
};

// Menu positioning constants
export const MENU_WIDTH = 160;
export const MENU_ITEM_HEIGHT = 40;
export const VIEWPORT_PADDING = 12;

