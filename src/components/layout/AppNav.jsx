'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  {
    label: 'Fixtures',
    href: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Team',
    href: '/team',
    requiresTeam: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Transfers',
    href: '/transfers',
    requiresTeam: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    label: 'Live',
    href: '/live',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    badge: true, // Show live indicator
  },
  {
    label: 'Leagues',
    href: '/leagues',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

function AppNavContent({ teamId }) {
  const pathname = usePathname();

  const getHref = (item) => {
    if (item.href === '/') return '/';
    if (teamId) {
      if (item.href === '/team') return `/team/${teamId}`;
      if (item.href === '/transfers') return `/team/${teamId}/transfers`;
      return `${item.href}?team=${teamId}`;
    }
    // If no teamId and item requires team, go to home
    if (item.requiresTeam) return '/';
    return item.href;
  };

  const isActive = (item) => {
    if (item.href === '/') return pathname === '/';
    if (item.href === '/transfers') return pathname.includes('/transfers');
    if (item.href === '/team') return pathname.startsWith('/team') && !pathname.includes('/transfers');
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--fpl-purple)] border-t border-white/10 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={getHref(item)}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors relative',
                  active ? 'text-[var(--fpl-green)]' : 'text-white/60 hover:text-white'
                )}
              >
                {item.badge && (
                  <span className="absolute top-1 right-1/4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--fpl-green)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--fpl-green)]"></span>
                  </span>
                )}
                {item.icon}
                <span className="text-xs mt-1 font-medium">{item.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--fpl-green)] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 lg:w-64 bg-[var(--fpl-purple)] flex-col z-40">
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--fpl-green)] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="hidden lg:block text-white font-bold text-lg">FPL Live</span>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={getHref(item)}
                className={cn(
                  'flex items-center gap-3 px-4 lg:px-6 py-3 mx-2 lg:mx-3 rounded-lg transition-all relative',
                  active
                    ? 'bg-white/10 text-[var(--fpl-green)]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                {item.badge && (
                  <span className="absolute top-2 left-10 lg:left-auto lg:right-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--fpl-green)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--fpl-green)]"></span>
                  </span>
                )}
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="hidden lg:block font-medium">{item.label}</span>
                {active && (
                  <span className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--fpl-green)] rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Team ID Section */}
        <Link
          href="/?change=true"
          className="block p-4 lg:p-6 border-t border-white/10 hover:bg-white/5 transition-colors group"
        >
          {teamId ? (
            <>
              <div className="hidden lg:block">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wide">Team ID</p>
                    <p className="text-white font-mono text-lg">{teamId}</p>
                  </div>
                  <svg className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="text-xs text-white/30 mt-1 group-hover:text-white/60">Click to change</p>
              </div>
              <div className="lg:hidden flex items-center justify-center gap-2">
                <span className="text-xs text-white/60 font-mono">{teamId}</span>
                <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </>
          ) : (
            <>
              <div className="hidden lg:flex items-center gap-3">
                <svg className="w-6 h-6 text-[var(--fpl-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <div>
                  <p className="text-white font-medium">Enter Team ID</p>
                  <p className="text-xs text-white/40">Track your FPL team</p>
                </div>
              </div>
              <div className="lg:hidden flex flex-col items-center">
                <svg className="w-5 h-5 text-[var(--fpl-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="text-[10px] text-white/60 mt-1">Add Team</span>
              </div>
            </>
          )}
        </Link>
      </aside>
    </>
  );
}

export default function AppNav({ teamId }) {
  return (
    <Suspense fallback={null}>
      <AppNavContent teamId={teamId} />
    </Suspense>
  );
}

// Hook to get team ID from URL or localStorage
export function useTeamId() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Check URL params first
  const teamParam = searchParams.get('team');
  if (teamParam) return teamParam;

  // Check pathname for /team/[teamId]
  const teamMatch = pathname.match(/\/team\/(\d+)/);
  if (teamMatch) return teamMatch[1];

  // Could also check localStorage here if needed
  return null;
}
