import { create } from 'zustand';

/**
 * Authentication store using Zustand
 * Manages user authentication state
 */
export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  isGuest: false,
  teamId: null,
  userName: null,

  /**
   * Set authenticated user state
   * @param {number} teamId - The FPL team ID
   * @param {string} userName - The user's display name
   */
  setAuthenticated: (teamId, userName) =>
    set({
      isAuthenticated: true,
      isGuest: false,
      teamId,
      userName,
    }),

  /**
   * Set guest user state
   * @param {number} teamId - The FPL team ID being viewed
   */
  setGuest: (teamId) =>
    set({
      isAuthenticated: false,
      isGuest: true,
      teamId,
      userName: null,
    }),

  /**
   * Clear auth state on logout
   */
  logout: () =>
    set({
      isAuthenticated: false,
      isGuest: false,
      teamId: null,
      userName: null,
    }),
}));
