'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { mentionApi } from '@/lib/api';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { MentionQueryParams } from '@/types';

// Hook to get mentions (paginated)
export function useMentions(params?: MentionQueryParams) {
  return useQuery({
    queryKey: queryKeys.mentions.list(),
    queryFn: () => mentionApi.list(params),
    staleTime: 30 * 1000,
  });
}

// Hook to get mentions with infinite scroll
export function useInfiniteMentions(params?: Omit<MentionQueryParams, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.mentions.list(), 'infinite', params],
    queryFn: ({ pageParam }) => mentionApi.list({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30 * 1000,
  });
}

