'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageCircle, Bell, Waves, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Navigation items configuration
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chats', label: 'Chats', icon: MessageCircle },
  { href: '/notifications', label: 'Notifications', icon: Bell },
] as const;

interface AppNavProps {
  unreadNotifications?: number;
  socketStatus?: string;
  isSocketConnected?: boolean;
}

// Socket connection status indicator component
function ConnectionIndicator({ status, isConnected }: { status: string; isConnected: boolean }) {
  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 gradient-status-connecting text-yellow-600 dark:text-yellow-400 rounded-md text-xs border border-yellow-500/20">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 gradient-status-online text-green-600 dark:text-green-400 rounded-md text-xs border border-green-500/20">
        <Wifi className="h-3 w-3" />
        <span>Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 gradient-status-offline text-red-600 dark:text-red-400 rounded-md text-xs border border-red-500/20">
      <WifiOff className="h-3 w-3" />
      <span>Disconnected</span>
    </div>
  );
}

// Desktop Sidebar Component
function DesktopSidebar({ unreadNotifications = 0, socketStatus = 'disconnected', isSocketConnected = false }: AppNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-40 md:border-r md:border-border md:bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Waves className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Wave</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const showBadge = item.href === '/notifications' && unreadNotifications > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
              {showBadge && (
                <Badge
                  variant="destructive"
                  className="ml-auto h-5 min-w-5 px-1.5 text-xs font-semibold"
                >
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className="px-3 py-4 border-t border-border">
        <ConnectionIndicator status={socketStatus} isConnected={isSocketConnected} />
      </div>
    </aside>
  );
}

// Mobile Bottom Navigation Component
function MobileBottomNav({ unreadNotifications = 0 }: AppNavProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Show nav when scrolling up or at top, hide when scrolling down
          if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            setIsVisible(false);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="flex items-center justify-around h-16 px-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const showBadge = item.href === '/notifications' && unreadNotifications > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full relative transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-8 rounded-full transition-colors',
                  isActive && 'bg-primary/10'
                )}
              >
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute top-2 right-1/2 translate-x-4 h-2.5 w-2.5 rounded-full bg-destructive" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Main Navigation Component
export function AppNav({ unreadNotifications = 0, socketStatus, isSocketConnected }: AppNavProps) {
  return (
    <>
      <DesktopSidebar
        unreadNotifications={unreadNotifications}
        socketStatus={socketStatus}
        isSocketConnected={isSocketConnected}
      />
      <MobileBottomNav unreadNotifications={unreadNotifications} />
    </>
  );
}

// Layout wrapper that accounts for nav spacing
export function AppNavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Desktop: left padding for sidebar */}
      <main className="md:pl-56 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}

