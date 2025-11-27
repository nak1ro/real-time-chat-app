'use client';

// Dashboard page - main authenticated view
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme';
import { ProfileActionsCard, QuickStatsCard, PeopleOnlineCard } from '@/components/dashboard';
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
        {/* Desktop: 2-column grid | Mobile: single column */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left Column: Profile & People Online */}
          <div className="space-y-5 lg:col-span-5 xl:col-span-4">
            <ProfileActionsCard />
            <PeopleOnlineCard />
          </div>

          {/* Right Column: Quick Stats */}
          <div className="lg:col-span-7 xl:col-span-8">
            <QuickStatsCard />
          </div>
        </div>
      </main>
    </div>
  );
}
