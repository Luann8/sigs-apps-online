import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,

      login: (userData) => {
        if (!userData) return false;
        set({
          isAuthenticated: true,
          user: userData,
        });
        return true;
      },

      updateProfile: (updatedData) => {
        const currentUser = get().user || {};
        set({
          user: {
            ...currentUser,
            ...updatedData,
          },
        });
      },

      logout: () => {
        set({ isAuthenticated: false, user: null });
      },
    }),
    {
      name: 'sigs-auth-session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
