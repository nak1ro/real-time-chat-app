'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Textarea,
  Label,
} from '@/components/ui';
import { Settings, Camera, Upload, Users, Megaphone, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/conversation.types';
import { ConversationType } from '@/types/enums';

interface ConversationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  isSaving?: boolean;
  onSave?: (data: { name?: string; description?: string; avatarUrl?: string }) => void;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ConversationSettingsModal({
  open,
  onOpenChange,
  conversation,
  isSaving = false,
  onSave,
}: ConversationSettingsModalProps) {
  const [name, setName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(conversation.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isChannel = conversation.type === ConversationType.CHANNEL;
  const typeLabel = isChannel ? 'Channel' : 'Group';

  // Reset form when conversation changes
  useEffect(() => {
    setName(conversation.name || '');
    setDescription(conversation.description || '');
    setAvatarPreview(conversation.avatarUrl);
  }, [conversation]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave?.({
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      avatarUrl: avatarPreview || undefined,
    });
    // Don't close here - parent will close after successful save
  };

  const hasChanges = 
    name !== (conversation.name || '') ||
    description !== (conversation.description || '') ||
    avatarPreview !== conversation.avatarUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {typeLabel} Settings
          </DialogTitle>
          <DialogDescription>
            Update your {typeLabel.toLowerCase()} information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || undefined} alt={name || typeLabel} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {isChannel ? (
                    <Megaphone className="h-10 w-10" />
                  ) : (
                    <Users className="h-10 w-10" />
                  )}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className={cn(
                  'absolute bottom-0 right-0 p-2 rounded-full',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 transition-colors',
                  'shadow-lg'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">{typeLabel} Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${typeLabel.toLowerCase()} name`}
              maxLength={100}
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe your ${typeLabel.toLowerCase()}...`}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

