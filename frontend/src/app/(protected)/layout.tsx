'use client';

// Protected layout - requires authentication
// Redirects to /auth if not authenticated
import { ReactQueryProvider, AuthProvider, SocketProvider } from '@/providers';
import { AuthGuard } from '@/components/auth';
import { AppNav, AppNavLayout } from '@/components/navigation';
import { useNotificationSocket, useNotificationUnreadCount } from '@/hooks/useNotifications';
import { useSocket } from '@/hooks';

// Component to initialize real-time notification listeners
function NotificationSocketListener() {
  useNotificationSocket();
  return null;
}

// Component to provide unread notification count and socket status to AppNav
function AppNavWithCount() {
  const { data: unreadCount = 0 } = useNotificationUnreadCount();
  const { status, isConnected } = useSocket();

  return <AppNav unreadNotifications={unreadCount} socketStatus={status} isSocketConnected={isConnected} />;
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
