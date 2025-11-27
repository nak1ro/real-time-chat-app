'use client';

// Protected layout - requires authentication
// Redirects to /login if not authenticated
import { ReactQueryProvider, AuthProvider } from '@/providers';
import { AuthGuard } from '@/components/auth';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <AuthGuard>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </AuthGuard>
      </AuthProvider>
    </ReactQueryProvider>
  );
}

