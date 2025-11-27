'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// Auth guard component - redirects to auth page if not authenticated
export function AuthGuard({ children, redirectTo = '/auth' }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading state while checking auth
  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  // Not authenticated, will redirect
  if (!isAuthenticated) {
    return <AuthLoadingSkeleton />;
  }

  // Authenticated, render children
  return <>{children}</>;
}

// Loading skeleton for auth check
function AuthLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

