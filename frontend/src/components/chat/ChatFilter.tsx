'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui';
import { MessageCircle, Users, Megaphone } from 'lucide-react';
import type { ConversationType } from '@/types';

export type ConversationFilter = ConversationType | 'ALL';

interface ChatFilterProps {
  value: ConversationFilter;
  onChange: (value: ConversationFilter) => void;
}

export function ChatFilter({ value, onChange }: ChatFilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ConversationFilter)}
      className="w-full bg-muted/50 p-1 rounded-lg"
    >
      <ToggleGroupItem
        value="ALL"
        size="sm"
        className="flex-1 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        All
      </ToggleGroupItem>
      <ToggleGroupItem
        value="DIRECT"
        size="sm"
        className="flex-1 text-xs gap-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Direct</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="GROUP"
        size="sm"
        className="flex-1 text-xs gap-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <Users className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Groups</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="CHANNEL"
        size="sm"
        className="flex-1 text-xs gap-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <Megaphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Channels</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
