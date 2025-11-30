// Auth hooks
export {
  useAuth,
  useLogin,
  useRegister,
  useLogout,
  useCurrentUser,
  useRefreshToken,
  useIsAuthenticated,
  useAuthActions,
} from './useAuth';

export type {
  UseLoginResult,
  UseRegisterResult,
  UseLogoutResult,
  UseCurrentUserResult,
  UseRefreshTokenResult,
} from './useAuth';

// User data utility hooks
export {
  useRefreshCurrentUser,
  useSetCurrentUser,
  useClearCurrentUser,
} from './useCurrentUser';

// User hooks
export {
  useUser,
  useUserSearch,
  useUpdateProfile,
  useUserPresence,
  useBulkPresence,
  useHeartbeat,
  usePermissionCheck,
  useUserActions,
} from './useUsers';

// Conversation hooks
export {
  useConversations,
  useConversation,
  usePublicChannels,
  useCreateDirectConversation,
  useCreateConversation,
  useUpdateConversation,
  useAddMembers,
  useRemoveMember,
  useLeaveConversation,
  useUpdateMemberRole,
  useJoinChannel,
  useGenerateSlug,
  useConversationActions,
  useConversationRole,
  useConversationAttachments,
  useDeleteConversation,
} from './useConversations';

// Message hooks
export {
  useMessages,
  useInfiniteMessages,
  useCreateMessage,
  useEditMessage,
  useDeleteMessage,
  useUploadAttachment,
  useMessageAttachments,
  useMarkAsRead,
  useMessageReadStats,
  useUnreadCount,
  useMessageActions,
  useMessageSocketListeners,
} from './useMessages';

// Reaction hooks
export {
  useMessageReactions,
  useToggleReaction,
  useReactionSocketListeners,
  useReactionActions,
} from './useReactions';

export type { UseMessageSocketListenersOptions } from './useMessages';

// Mention hooks
export {
  useMentions,
  useInfiniteMentions,
} from './useMentions';

// Notification hooks
export {
  useNotifications,
  useInfiniteNotifications,
  useNotificationUnreadCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useMarkConversationNotificationsAsRead,
  useNotificationActions,
} from './useNotifications';

// Moderation hooks
export {
  useMuteStatus,
  useApplyModeration,
  useMuteUser,
  useKickUser,
  useBanUser,
  useDeleteMessageModeration,
  useModerationActions,
  useModerationSocketListeners,
} from './useModeration';

// Socket hooks
export { useSocket } from './useSocket';

// Theme hooks
export { useTheme } from './useTheme';
