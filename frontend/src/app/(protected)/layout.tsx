'use client';

// Protected layout - requires authentication
// Redirects to /auth if not authenticated
import { ReactQueryProvider, AuthProvider, SocketProvider } from '@/providers';
import { AuthGuard } from '@/components/auth';
import { AppNav, AppNavLayout } from '@/components/navigation';
import { useNotificationSocket, useNotificationUnreadCount } from '@/hooks/useNotifications';

// Component to initialize real-time notification listeners
function NotificationSocketListener() {
  useNotificationSocket();
  return null;
}

// Component to provide unread notification count to AppNav
function AppNavWithCount() {
  const { data: unreadCount = 0 } = useNotificationUnreadCount();

  return <AppNav unreadNotifications={unreadCount} />;
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
            <AppNavWithCount />
            <AppNavLayout>
              {children}
            </AppNavLayout>
          </AuthGuard>
        </SocketProvider>
      </AuthProvider>
    </ReactQueryProvider>
  );
}
