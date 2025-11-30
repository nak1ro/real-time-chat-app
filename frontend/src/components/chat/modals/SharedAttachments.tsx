'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, ScrollArea, Skeleton } from '@/components/ui';
import { ImageIcon, FileText, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Attachment } from '@/types/message.types';
import { AttachmentType } from '@/types/enums';

interface SharedAttachmentsProps {
  images: Attachment[];
  files: Attachment[];
  isLoading?: boolean;
  maxVisible?: number;
  onViewAllImages?: () => void;
  onViewAllFiles?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(date: Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  if (mimeType.includes('csv')) return '📈';
  return '📎';
}

function ImageGrid({ 
  images, 
  maxVisible, 
  onViewAll,
  isLoading 
}: { 
  images: Attachment[]; 
  maxVisible: number; 
  onViewAll?: () => void;
  isLoading?: boolean;
}) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ImageIcon className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No images shared yet</p>
      </div>
    );
  }

  const visibleImages = images.slice(0, maxVisible);
  const hasMore = images.length > maxVisible;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {visibleImages.map((image) => (
          <button
            key={image.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setLightboxImage(image.url)}
          >
            <img
              src={image.thumbnailUrl || image.url}
              alt={image.fileName}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
      
      {hasMore && (
        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={onViewAll}
        >
          View All ({images.length} images)
        </Button>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-accent text-foreground transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            ✕
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function FilesList({ 
  files, 
  maxVisible, 
  onViewAll,
  isLoading 
}: { 
  files: Attachment[]; 
  maxVisible: number; 
  onViewAll?: () => void;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No files shared yet</p>
      </div>
    );
  }

  const visibleFiles = files.slice(0, maxVisible);
  const hasMore = files.length > maxVisible;

  return (
    <>
      <div className="space-y-2">
        {visibleFiles.map((file) => (
          <a
            key={file.id}
            href={file.url}
            download={file.fileName}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg transition-colors group',
              'bg-secondary hover:bg-accent',
              'border border-border hover:border-primary/30'
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border text-lg">
              {getFileIcon(file.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {file.fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.sizeBytes)} • {formatDate(file.createdAt)}
              </p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </a>
        ))}
      </div>
      
      {hasMore && (
        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={onViewAll}
        >
          View All ({files.length} files)
        </Button>
      )}
    </>
  );
}

export function SharedAttachments({
  images,
  files,
  isLoading = false,
  maxVisible = 6,
  onViewAllImages,
  onViewAllFiles,
}: SharedAttachmentsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Shared Media & Files</h3>
      
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images" className="text-xs">
            Images ({images.length})
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs">
            Files ({files.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="mt-3">
          <ScrollArea className="max-h-[250px]">
            <ImageGrid
              images={images}
              maxVisible={maxVisible}
              onViewAll={onViewAllImages}
              isLoading={isLoading}
            />
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="files" className="mt-3">
          <ScrollArea className="max-h-[250px]">
            <FilesList
              files={files}
              maxVisible={maxVisible}
              onViewAll={onViewAllFiles}
              isLoading={isLoading}
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

