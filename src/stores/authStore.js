import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  isGuest: false,
  userId: null,
  teamId: null,
  userName: null,
  isCheckingSession: true,

  setAuthenticated: (teamId, userName, userId = null) =>
    set({
      isAuthenticated: true,
      isGuest: false,
      userId,
      teamId,
      userName,
      isCheckingSession: false,
    }),

  setGuest: (teamId) =>
    set({
      isAuthenticated: false,
      isGuest: true,
      userId: null,
      teamId,
      userName: null,
      isCheckingSession: false,
    }),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    set({
      isAuthenticated: false,
      isGuest: false,
      userId: null,
      teamId: null,
      userName: null,
      isCheckingSession: false,
    });
  },

  checkSession: async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.authenticated && data.user) {
        set({
          isAuthenticated: true,
          isGuest: false,
          userId: data.user.userId,
          teamId: data.user.teamId,
          userName: data.user.name,
          isCheckingSession: false,
        });
        return data.user;
      }
    } catch (error) {
      console.error('Session check error:', error);
    }

    set({ isCheckingSession: false });
    return null;
  },
}));
