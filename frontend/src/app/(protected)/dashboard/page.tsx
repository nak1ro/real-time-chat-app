'use client';

// Dashboard page - main authenticated view
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme';
import { ProfileActionsCard, PeopleOnlineCard } from '@/components/dashboard';
import { LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Desktop: 2-column grid (equal width) | Mobile: single column */}
        <div className="grid gap-5 lg:grid-cols-2">
          <ProfileActionsCard />
          <PeopleOnlineCard />
        </div>
      </main>
    </div>
  );
}
