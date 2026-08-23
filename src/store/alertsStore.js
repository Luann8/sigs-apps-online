import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Persiste quais alertas o usuário já viu.
 */
export const useAlertsStore = create(
  persist(
    (set, get) => ({
      seenIds: [],

      markAsSeen: (ids) => {
        const current = new Set(get().seenIds);
        ids.forEach((id) => current.add(id));
        set({ seenIds: Array.from(current) });
      },

      isSeen: (id) => get().seenIds.includes(id),

      countUnseen: (alertas) => {
        if (!alertas || !Array.isArray(alertas)) return 0;
        const seen = new Set(get().seenIds);
        return alertas.filter((a) => !seen.has(a.id)).length;
      },

      clearSeen: () => set({ seenIds: [] }),
    }),
    {
      name: 'sigs-alerts-seen',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
