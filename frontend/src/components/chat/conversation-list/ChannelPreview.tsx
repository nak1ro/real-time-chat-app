'use client';

import { Avatar, AvatarFallback, AvatarImage, Button } from '@/components/ui';
import { Hash, Users, ArrowRight } from 'lucide-react';
import type { Conversation } from '@/types';

interface ChannelPreviewProps {
    channel: Conversation;
    onJoin: () => void;
    onCancel: () => void;
    isJoining?: boolean;
}

export function ChannelPreview({
                                   channel,
                                   onJoin,
                                   onCancel,
                                   isJoining = false,
                               }: ChannelPreviewProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-2xl border border-border shadow-sm">
                {/* Header section */}
                <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24 border-4 border-muted">
                        <AvatarImage src={channel.avatarUrl || undefined} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            <Hash className="h-10 w-10" />
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">{channel.name}</h2>
                        {channel.description && (
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {channel.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Stats section */}
                <div className="flex items-center justify-center gap-6 py-4 border-y border-border">
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Members</span>
                        </div>
                        <span className="text-xl font-semibold">
                            {channel._count?.members ?? 0}
                        </span>
                    </div>
                </div>

                {/* Actions section */}
                <div className="flex flex-col gap-3">
                    <Button
                        size="lg"
                        className="w-full gap-2"
                        onClick={onJoin}
                        disabled={isJoining}
                    >
                        {isJoining ? 'Joining...' : 'Enter Channel'}
                        {!isJoining && <ArrowRight className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="w-full"
                        onClick={onCancel}
                        disabled={isJoining}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}