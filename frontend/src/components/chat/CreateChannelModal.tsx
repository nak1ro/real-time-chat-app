'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateConversation, useGenerateSlug } from '@/hooks/useConversations';
import { ConversationType } from '@/types/enums';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Textarea,
  Switch,
} from '@/components/ui';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { Loader2, Users, Megaphone, Hash, Globe, Lock } from 'lucide-react';
import { protectedRoutes } from '@/config/routes';

interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (conversationId: string) => void;
}

interface FormErrors {
  name?: string;
  slug?: string;
  general?: string;
}

export function CreateChannelModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateChannelModalProps) {
  const router = useRouter();

  // Form state
  const [type, setType] = useState<'GROUP' | 'CHANNEL'>('GROUP');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Hooks
  const generateSlug = useGenerateSlug({
    onSuccess: (generatedSlug) => {
      setSlug(generatedSlug);
    },
  });

  const createConversation = useCreateConversation({
    onSuccess: (conversation) => {
      resetForm();
      onOpenChange(false);
      onSuccess?.(conversation.id);
      // Navigate to the new conversation
      router.push(`${protectedRoutes.chats}?id=${conversation.id}`);
    },
    onError: (error) => {
      setErrors({ general: error.message || 'Failed to create conversation' });
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Auto-generate slug when name changes (for channels)
  useEffect(() => {
    if (type === 'CHANNEL' && name.trim() && name.length >= 2) {
      const debounce = setTimeout(() => {
        generateSlug.mutate(name);
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [name, type]);

  const resetForm = () => {
    setType('GROUP');
    setName('');
    setDescription('');
    setSlug('');
    setIsPublic(false);
    setIsReadOnly(false);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (type === 'CHANNEL' && isPublic && !slug.trim()) {
      newErrors.slug = 'Slug is required for public channels';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createConversation.mutate({
      name: name.trim(),
      type: type as ConversationType,
      description: description.trim() || undefined,
      slug: type === 'CHANNEL' && slug.trim() ? slug.trim() : undefined,
      isPublic: type === 'CHANNEL' ? isPublic : false,
      isReadOnly: type === 'CHANNEL' ? isReadOnly : false,
    });
  };

  const handleTypeChange = (newType: string) => {
    setType(newType as 'GROUP' | 'CHANNEL');
    // Reset channel-specific fields when switching to GROUP
    if (newType === 'GROUP') {
      setSlug('');
      setIsPublic(false);
      setIsReadOnly(false);
    }
  };

  const isLoading = createConversation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'GROUP' ? (
              <Users className="h-5 w-5 text-primary" />
            ) : (
              <Megaphone className="h-5 w-5 text-primary" />
            )}
            Create {type === 'GROUP' ? 'Group' : 'Channel'}
          </DialogTitle>
          <DialogDescription>
            {type === 'GROUP'
              ? 'Create a private group for conversations with multiple people.'
              : 'Create a channel to broadcast messages to a larger audience.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Type Toggle */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Tabs value={type} onValueChange={handleTypeChange} className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="GROUP" className="gap-2">
                  <Users className="h-4 w-4" />
                  Group
                </TabsTrigger>
                <TabsTrigger value="CHANNEL" className="gap-2">
                  <Megaphone className="h-4 w-4" />
                  Channel
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder={type === 'GROUP' ? 'My awesome group' : 'announcements'}
              disabled={isLoading}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this conversation about?"
              disabled={isLoading}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Channel-specific fields */}
          {type === 'CHANNEL' && (
            <>
              {/* Slug Field */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5" />
                  URL Slug
                  {isPublic && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                      if (errors.slug) setErrors((prev) => ({ ...prev, slug: undefined }));
                    }}
                    placeholder="my-channel"
                    disabled={isLoading}
                    className={`pl-7 ${errors.slug ? 'border-destructive' : ''}`}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    #
                  </span>
                </div>
                {generateSlug.isPending && (
                  <p className="text-xs text-muted-foreground">Generating slug...</p>
                )}
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Used for joining via URL. Only lowercase letters, numbers, and hyphens.
                </p>
              </div>

              {/* Public Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Globe className="h-5 w-5 text-primary" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="space-y-0.5">
                    <Label htmlFor="isPublic" className="cursor-pointer">
                      Public Channel
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isPublic
                        ? 'Anyone can discover and join this channel'
                        : 'Only invited members can join'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  disabled={isLoading}
                />
              </div>

              {/* Read-only Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isReadOnly" className="cursor-pointer">
                    Announcement Only
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only admins and moderators can send messages
                  </p>
                </div>
                <Switch
                  id="isReadOnly"
                  checked={isReadOnly}
                  onCheckedChange={setIsReadOnly}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {errors.general}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create {type === 'GROUP' ? 'Group' : 'Channel'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

