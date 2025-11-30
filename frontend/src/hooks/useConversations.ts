'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from '@/lib/api';
import { queryKeys } from '@/lib/react-query/query-keys';
import type {
  Conversation,
  ConversationFilters,
  CreateDirectConversationData,
  CreateConversationData,
  UpdateConversationPatch,
  AddMembersData,
  MemberRole,
} from '@/types';

// Hook to list user's conversations
export function useConversations(filters?: ConversationFilters) {
  return useQuery({
    queryKey: queryKeys.conversations.list(filters),
    queryFn: () => conversationApi.list(filters),
    staleTime: 2 * 60 * 1000,
  });
}

// Hook to get a single conversation by ID
export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(id!),
    queryFn: () => conversationApi.getById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

// Hook to list public channels
export function usePublicChannels(filters?: { name?: string }) {
  return useQuery({
    queryKey: queryKeys.conversations.public(),
    queryFn: () => conversationApi.listPublic(filters),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create a direct conversation
export function useCreateDirectConversation(options?: {
  onSuccess?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDirectConversationData) => conversationApi.createDirect(data),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      queryClient.setQueryData(queryKeys.conversations.detail(conversation.id), conversation);
      options?.onSuccess?.(conversation);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to create a group or channel conversation
export function useCreateConversation(options?: {
  onSuccess?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationData) => conversationApi.create(data),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      queryClient.setQueryData(queryKeys.conversations.detail(conversation.id), conversation);
      options?.onSuccess?.(conversation);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to update a conversation
export function useUpdateConversation(options?: {
  onSuccess?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConversationPatch }) =>
      conversationApi.update(id, data),
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.conversations.detail(conversation.id), conversation);
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list() });
      options?.onSuccess?.(conversation);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to add members to a conversation
export function useAddMembers(options?: {
  onSuccess?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddMembersData }) =>
      conversationApi.addMembers(id, data),
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.conversations.detail(conversation.id), conversation);
      options?.onSuccess?.(conversation);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to remove a member from a conversation
export function useRemoveMember(options?: {
  onSuccess?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
      conversationApi.removeMember(id, memberId),
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.conversations.detail(conversation.id), conversation);
      options?.onSuccess?.(conversation);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to leave a conversation
export function useLeaveConversation(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => conversationApi.leave(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.conversations.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to update a member's role
export function useUpdateMemberRole(options?: {
  onSuccess?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, memberId, role }: { id: string; memberId: string; role: MemberRole }) =>
      conversationApi.updateMemberRole(id, memberId, { role }),
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.conversations.detail(conversation.id), conversation);
      options?.onSuccess?.(conversation);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to join a public channel by slug
export function useJoinChannel(options?: {
  onSuccess?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => conversationApi.joinBySlug(slug),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      queryClient.setQueryData(queryKeys.conversations.detail(conversation.id), conversation);
      options?.onSuccess?.(conversation);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to generate a slug from a name
export function useGenerateSlug(options?: {
  onSuccess?: (slug: string) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (name: string) => conversationApi.generateSlug({ name }),
    onSuccess: (slug) => {
      options?.onSuccess?.(slug);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Utility hook that provides all conversation operations
export function useConversationActions() {
  const createDirect = useCreateDirectConversation();
  const create = useCreateConversation();
  const update = useUpdateConversation();
  const addMembers = useAddMembers();
  const removeMember = useRemoveMember();
  const leave = useLeaveConversation();
  const updateRole = useUpdateMemberRole();
  const join = useJoinChannel();
  const generateSlug = useGenerateSlug();

  return {
    createDirect: createDirect.mutate,
    createDirectAsync: createDirect.mutateAsync,
    isCreatingDirect: createDirect.isPending,
    create: create.mutate,
    createAsync: create.mutateAsync,
    isCreating: create.isPending,
    update: update.mutate,
    updateAsync: update.mutateAsync,
    isUpdating: update.isPending,
    addMembers: addMembers.mutate,
    addMembersAsync: addMembers.mutateAsync,
    isAddingMembers: addMembers.isPending,
    removeMember: removeMember.mutate,
    removeMemberAsync: removeMember.mutateAsync,
    isRemovingMember: removeMember.isPending,
    leave: leave.mutate,
    leaveAsync: leave.mutateAsync,
    isLeaving: leave.isPending,
    updateRole: updateRole.mutate,
    updateRoleAsync: updateRole.mutateAsync,
    isUpdatingRole: updateRole.isPending,
    join: join.mutate,
    joinAsync: join.mutateAsync,
    isJoining: join.isPending,
    generateSlug: generateSlug.mutate,
    generateSlugAsync: generateSlug.mutateAsync,
    isGeneratingSlug: generateSlug.isPending,
  };
}

// Hook to get user role in conversation
export * from './useConversationRole';
