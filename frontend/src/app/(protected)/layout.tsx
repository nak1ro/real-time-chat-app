'use client';

// Protected layout - requires authentication
// Redirects to /auth if not authenticated
import { ReactQueryProvider, AuthProvider, SocketProvider } from '@/providers';
import { AuthGuard } from '@/components/auth';
import { AppNav, AppNavLayout } from '@/components/navigation';
import { useNotificationSocket } from '@/hooks/useNotifications';

// Component to initialize real-time notification listeners
function NotificationSocketListener() {
  useNotificationSocket();
  return null;
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <SocketProvider>
          <AuthGuard>
            <NotificationSocketListener />
            <AppNav unreadNotifications={3} />
            <AppNavLayout>
              {children}
            </AppNavLayout>
          </AuthGuard>
        </SocketProvider>
      </AuthProvider>
    </ReactQueryProvider>
  );
}
