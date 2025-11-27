'use client';

// Chat type filter component
import { ToggleGroup, ToggleGroupItem } from '@/components/ui';
import { MessageCircle, Users, Megaphone } from 'lucide-react';
import type { ChatFilter as ChatFilterType } from './types';

interface ChatFilterProps {
  value: ChatFilterType;
  onChange: (value: ChatFilterType) => void;
}

export function ChatFilter({ value, onChange }: ChatFilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ChatFilterType)}
      className="w-full bg-muted/50 p-1 rounded-lg"
    >
      <ToggleGroupItem
        value="all"
        size="sm"
        className="flex-1 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        All
      </ToggleGroupItem>
      <ToggleGroupItem
        value="direct"
        size="sm"
        className="flex-1 text-xs gap-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Direct</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="group"
        size="sm"
        className="flex-1 text-xs gap-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <Users className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Groups</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="channel"
        size="sm"
        className="flex-1 text-xs gap-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <Megaphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Channels</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

