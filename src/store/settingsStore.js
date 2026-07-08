import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSettingsStore = create(
  persist(
    (set) => ({
      alertasAtivos: true,
      diasAntecedencia: 7,
      hasSeenTutorial: false,
      
      setAlertasAtivos: (ativo) => set({ alertasAtivos: ativo }),
      setDiasAntecedencia: (dias) => set({ diasAntecedencia: dias }),
      setHasSeenTutorial: (val) => set({ hasSeenTutorial: val }),
    }),
    {
      name: 'sigs-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
