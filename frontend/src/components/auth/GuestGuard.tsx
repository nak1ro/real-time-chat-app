'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// Guest guard component - redirects to dashboard if already authenticated
export function GuestGuard({ children, redirectTo = '/dashboard' }: GuestGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading state while checking auth
  if (isLoading) {
    return <GuestLoadingSkeleton />;
  }

  // Authenticated, will redirect
  if (isAuthenticated) {
    return <GuestLoadingSkeleton />;
  }

  // Not authenticated, render children (login/register forms)
  return <>{children}</>;
}

// Loading skeleton for guest check
function GuestLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}

