'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

/**
 * Auth provider that checks session on mount
 * and redirects logged-in users to their team page
 */
export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const checkSession = useAuthStore((state) => state.checkSession);
  const isCheckingSession = useAuthStore((state) => state.isCheckingSession);

  useEffect(() => {
    async function initSession() {
      const user = await checkSession();

      // If user is logged in and on an auth page, redirect to their team
      if (user && ['/login', '/register', '/guest', '/'].includes(pathname)) {
        router.replace(`/team/${user.teamId}`);
      }
    }

    initSession();
  }, []);

  return children;
}
