'use client';

// Empty state when no chat is selected
import { MessageCircle } from 'lucide-react';

export function EmptyChatState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Select a chat</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        Choose a conversation from the list to start messaging
      </p>
    </div>
  );
}

