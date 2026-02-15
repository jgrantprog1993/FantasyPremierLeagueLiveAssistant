'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import AppNav from '@/components/layout/AppNav';

function AuthLayoutContent({ children }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppNav teamId={null} />
      <main className="md:ml-20 lg:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function AuthLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)]">
        <main className="md:ml-20 lg:ml-64 pb-20 md:pb-0 min-h-screen">
          {children}
        </main>
      </div>
    }>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </Suspense>
  );
}
