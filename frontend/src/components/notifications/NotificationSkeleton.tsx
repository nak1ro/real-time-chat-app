'use client';

import { Skeleton } from '@/components/ui';

interface NotificationSkeletonProps {
  count?: number;
}

function SingleSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 md:p-4">
      {/* Avatar skeleton */}
      <Skeleton className="h-10 w-10 md:h-11 md:w-11 rounded-full flex-shrink-0" />

      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </div>

      {/* Time skeleton */}
      <Skeleton className="h-3 w-12 flex-shrink-0" />
    </div>
  );
}

export function NotificationSkeleton({ count = 5 }: NotificationSkeletonProps) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </div>
  );
}

