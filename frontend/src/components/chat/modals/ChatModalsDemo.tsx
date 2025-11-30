'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { MessageCircle, Users, Megaphone } from 'lucide-react';
import { ConversationModal } from './ConversationModal';
import { 
  mockDirectConversations, 
  mockGroupConversations, 
  mockChannelConversation,
  mockImageAttachments,
  mockFileAttachments,
  mockUsers,
  CURRENT_USER_ID,
  getUserById,
} from './mock-data';

type ModalType = 'dm' | 'group-admin' | 'group-member' | 'channel' | null;

export function ChatModalsDemo() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleAction = (action: string, ...args: unknown[]) => {
    console.log(`Action: ${action}`, args);
    // In a real app, these would call API endpoints
  };

  const currentConversation = (() => {
    switch (activeModal) {
      case 'dm':
        return mockDirectConversations[0];
      case 'group-admin':
        return mockGroupConversations[0]; // User is admin
      case 'group-member':
        return mockGroupConversations[1]; // User is member
      case 'channel':
        return mockChannelConversation;
      default:
        return null;
    }
  })();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Chat Modals Demo</h1>
        <p className="text-muted-foreground">
          Click a button to open different types of chat modals with mock data.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setActiveModal('dm')}
        >
          <MessageCircle className="h-8 w-8 text-primary" />
          <span className="font-medium">Direct Message</span>
          <span className="text-xs text-muted-foreground">1-on-1 chat</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setActiveModal('group-admin')}
        >
          <Users className="h-8 w-8 text-blue-500" />
          <span className="font-medium">Group (Admin)</span>
          <span className="text-xs text-muted-foreground">With moderation</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setActiveModal('group-member')}
        >
          <Users className="h-8 w-8 text-green-500" />
          <span className="font-medium">Group (Member)</span>
          <span className="text-xs text-muted-foreground">Limited actions</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setActiveModal('channel')}
        >
          <Megaphone className="h-8 w-8 text-amber-500" />
          <span className="font-medium">Channel (Owner)</span>
          <span className="text-xs text-muted-foreground">Full control</span>
        </Button>
      </div>

      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Current User ID:</strong> {CURRENT_USER_ID}</p>
        <p>Open browser console to see action logs when interacting with modals.</p>
      </div>

      {currentConversation && (
        <ConversationModal
          open={activeModal !== null}
          onOpenChange={(open) => !open && setActiveModal(null)}
          conversation={currentConversation}
          currentUserId={CURRENT_USER_ID}
          images={mockImageAttachments}
          files={mockFileAttachments}
          availableUsers={mockUsers}
          getUserStatus={getUserById}
          
          // DM callbacks
          onStartMessaging={() => handleAction('startMessaging')}
          onDeleteChat={() => handleAction('deleteChat')}
          onBlockUser={() => handleAction('blockUser')}
          
          // Group callbacks
          onLeaveGroup={() => handleAction('leaveGroup')}
          onKickMember={(userId) => handleAction('kickMember', userId)}
          onInviteUsers={(userIds) => handleAction('inviteUsers', userIds)}
          
          // Channel callbacks
          onLeaveChannel={() => handleAction('leaveChannel')}
          onDeleteChannel={() => handleAction('deleteChannel')}
          onRemoveSubscriber={(userId) => handleAction('removeSubscriber', userId)}
          
          // Common callbacks
          onUpdateSettings={(data) => handleAction('updateSettings', data)}
          onUpdateRoles={(updates) => handleAction('updateRoles', updates)}
        />
      )}
    </div>
  );
}

