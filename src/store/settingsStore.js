import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      alertasAtivos: true,
      diasAntecedencia: 7,
      hasSeenTutorial: false,
      theme: 'light',
      
      setAlertasAtivos: (ativo) => set({ alertasAtivos: ativo }),
      setDiasAntecedencia: (dias) => set({ diasAntecedencia: dias }),
      setHasSeenTutorial: (val) => set({ hasSeenTutorial: val }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'sigs-settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
