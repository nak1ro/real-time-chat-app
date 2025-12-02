'use client';

import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { BaseGuard } from './BaseGuard';
import { GuardLayout } from './GuardLayout';
import React from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// Loading skeleton specific to auth check
function AuthLoadingSkeleton() {
  return (
      <GuardLayout>
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </GuardLayout>
  );
}

// Auth guard component - redirects to auth page if not authenticated
export function AuthGuard({ children, redirectTo = '/auth' }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
      <BaseGuard
          redirectTo={redirectTo}
          isReady={!isLoading}
          shouldRedirect={!isAuthenticated}
          loadingComponent={<AuthLoadingSkeleton />}
      >
        {children}
      </BaseGuard>
  );
}