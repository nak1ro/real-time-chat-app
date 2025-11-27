'use client';

// Public layout for auth pages (login, register)
// Redirects to dashboard if already authenticated
import { ReactQueryProvider, AuthProvider } from '@/providers';
import { GuestGuard } from '@/components/auth';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <GuestGuard>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </GuestGuard>
      </AuthProvider>
    </ReactQueryProvider>
  );
}

