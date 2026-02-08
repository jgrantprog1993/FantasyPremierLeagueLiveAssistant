import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI state store using Zustand
 * Persists theme preference to localStorage
 */
export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'system',              // 'light', 'dark', or 'system'
      sidebarOpen: true,
      mobileMenuOpen: false,

      /**
       * Set the app theme
       * @param {'light' | 'dark' | 'system'} theme
       */
      setTheme: (theme) => set({ theme }),

      /**
       * Toggle the sidebar visibility
       */
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      /**
       * Set sidebar visibility
       * @param {boolean} open
       */
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      /**
       * Toggle mobile menu visibility
       */
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      /**
       * Set mobile menu visibility
       * @param {boolean} open
       */
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'fpl-ui-store',
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    }
  )
);
