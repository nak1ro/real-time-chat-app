'use client';

import { Button, Switch, Label } from '@/components/ui';
import { Trash2 } from 'lucide-react';

interface NotificationControlsProps {
  messagesOnly: boolean;
  onMessagesOnlyChange: (value: boolean) => void;
  onClearAll: () => void;
  hasNotifications: boolean;
}

export function NotificationControls({
  messagesOnly,
  onMessagesOnlyChange,
  onClearAll,
  hasNotifications,
}: NotificationControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      {/* Messages filter toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="messages-filter"
          checked={messagesOnly}
          onCheckedChange={onMessagesOnlyChange}
        />
        <Label
          htmlFor="messages-filter"
          className="text-sm font-medium cursor-pointer select-none"
        >
          Messages
        </Label>
      </div>

      {/* Clear all button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        disabled={!hasNotifications}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        Clear all
      </Button>
    </div>
  );
}

