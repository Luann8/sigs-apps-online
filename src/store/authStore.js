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

      loginAsGuest: () => {
        set({
          isAuthenticated: true,
          user: {
            id: 'convidado',
            name: 'Visitante (Acesso Restrito)',
            email: 'visitante@externo',
            role: 'Visitante',
            status: 'visitante',
            ativo: true,
            podeLerTodos: false,
            podeEditar: false,
            avatar: 'https://ui-avatars.com/api/?name=Visitante&background=64748B&color=fff&size=150',
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
