'use client';

import {useAuth} from '@/hooks/useAuth';
import {Skeleton} from '@/components/ui/skeleton';
import {BaseGuard} from './BaseGuard';
import {GuardLayout} from './GuardLayout';
import React from "react";

interface GuestGuardProps {
    children: React.ReactNode;
    redirectTo?: string;
}

// Loading skeleton specific to guest check
function GuestLoadingSkeleton() {
    return (
        <GuardLayout>
            <Skeleton className="h-8 w-48"/>
            <Skeleton className="h-4 w-64"/>
        </GuardLayout>
    );
}

// Guest guard component - redirects to dashboard if already authenticated
export function GuestGuard({children, redirectTo = '/dashboard'}: GuestGuardProps) {
    const {isAuthenticated, isLoading} = useAuth();

    return (
        <BaseGuard
            redirectTo={redirectTo}
            isReady={!isLoading}
            shouldRedirect={isAuthenticated}
            loadingComponent={<GuestLoadingSkeleton/>}
        >
            {children}
        </BaseGuard>
    );
}