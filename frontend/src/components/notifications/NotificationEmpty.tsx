'use client';

import { BellOff } from 'lucide-react';

export function NotificationEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <BellOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-1">You're all caught up</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        No new notifications. We'll let you know when something happens.
      </p>
    </div>
  );
}

