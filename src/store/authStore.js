import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: true,
      user: {
        id: 'user_default',
        name: 'Fiscal Responsável',
        email: 'fiscal@sigs.gov.br',
        role: 'Administrador Sanitário',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },

      login: (email, password, customUser = null) => {
        if (!email || !password) return false;

        if (customUser) {
          set({
            isAuthenticated: true,
            user: customUser,
          });
          return true;
        }

        const nameFromEmail = email.split('@')[0].replace('.', ' ');
        const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

        set({
          isAuthenticated: true,
          user: {
            id: `user_${Date.now()}`,
            name: formattedName || 'Usuário SIGS',
            email: email,
            role: 'Gestor de Alvarás',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          },
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
