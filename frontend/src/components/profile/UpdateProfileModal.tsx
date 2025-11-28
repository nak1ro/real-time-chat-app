'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateProfile } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/react-query/query-keys';
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
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui';
import { Loader2, Upload } from 'lucide-react';

interface UpdateProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpdateProfileModal({ open, onOpenChange }: UpdateProfileModalProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [name, setName] = useState(user?.name || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const updateProfile = useUpdateProfile({
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
            onOpenChange(false);
            // Reset form
            setName(user?.name || '');
            setAvatarFile(null);
            setAvatarPreview(null);
        },
        onError: (error) => {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        },
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB');
                return;
            }

            setAvatarFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updates: { name?: string; avatar?: File } = {};

        if (name && name !== user?.name) {
            updates.name = name;
        }

        if (avatarFile) {
            updates.avatar = avatarFile;
        }

        if (Object.keys(updates).length === 0) {
            onOpenChange(false);
            return;
        }

        updateProfile.mutate(updates);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information. Changes will be saved automatically.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage
                                src={avatarPreview || user?.avatarUrl || undefined}
                                alt={name || user?.name}
                            />
                            <AvatarFallback className="text-2xl font-medium bg-primary/10 text-primary">
                                {name ? getInitials(name) : user?.name ? getInitials(user.name) : '?'}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col items-center gap-2">
                            <Label
                                htmlFor="avatar-upload"
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                            >
                                <Upload className="h-4 w-4" />
                                <span>Upload new photo</span>
                            </Label>
                            <Input
                                id="avatar-upload"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <p className="text-xs text-muted-foreground">
                                Max size: 5MB. Supported: JPG, PNG, GIF, WebP
                            </p>
                        </div>
                    </div>

                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Username</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your username"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateProfile.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateProfile.isPending}>
                            {updateProfile.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
