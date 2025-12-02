'use client';

import React, {useEffect} from 'react';
import {useRouter} from 'next/navigation';

interface BaseGuardProps {
    children: React.ReactNode;
    redirectTo: string;
    isReady: boolean;
    shouldRedirect: boolean;
    loadingComponent: React.ReactNode;
}

// Base guard logic handling redirection and loading states
export function BaseGuard({children, redirectTo, isReady, shouldRedirect, loadingComponent}: BaseGuardProps) {
    const router = useRouter();

    useEffect(() => {
        if (isReady && shouldRedirect) {
            router.replace(redirectTo);
        }
    }, [isReady, shouldRedirect, router, redirectTo]);

    // Show loading state if checking auth or preparing to redirect
    if (!isReady || shouldRedirect) {
        return <>{loadingComponent}</>;
    }

    // Render children when safe
    return <>{children}</>;
}