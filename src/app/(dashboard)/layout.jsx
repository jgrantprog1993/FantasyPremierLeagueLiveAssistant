'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import AppNav from '@/components/layout/AppNav';

function DashboardLayoutContent({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get team ID from URL
  const getTeamId = () => {
    // Check URL params first
    const teamParam = searchParams.get('team');
    if (teamParam) return teamParam;

    // Check pathname for /team/[teamId]
    const teamMatch = pathname.match(/\/team\/(\d+)/);
    if (teamMatch) return teamMatch[1];

    return null;
  };

  const teamId = getTeamId();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* App Navigation */}
      <AppNav teamId={teamId} />

      {/* Main Content - with padding for nav */}
      <main className="md:ml-20 lg:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)]">
        <main className="md:ml-20 lg:ml-64 pb-20 md:pb-0 min-h-screen">
          {children}
        </main>
      </div>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
