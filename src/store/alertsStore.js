import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persiste quais alertas o usuário já viu.
 *
 * A chave de cada alerta é derivada do que a AlertasScreen gera:
 *   `vencida-{licencaId}`, `urgente-{licencaId}`, `vencendo-{licencaId}`,
 *   `pendente-{licencaId}`
 *
 * Quando o usuário abre a tela de Alertas, todos os IDs visíveis naquele
 * momento são marcados como vistos.  Um alerta que ainda não estava na lista
 * vista é considerado "novo" (não lido).
 */
export const useAlertsStore = create(
  persist(
    (set, get) => ({
      /** Set de IDs de alertas já vistos pelo usuário */
      seenIds: [],

      /**
       * Marca uma lista de IDs como vistos.
       * Faz merge com os já existentes para não perder histórico.
       */
      markAsSeen: (ids) => {
        const current = new Set(get().seenIds);
        ids.forEach((id) => current.add(id));
        set({ seenIds: Array.from(current) });
      },

      /** Verifica se um alerta específico já foi visto */
      isSeen: (id) => get().seenIds.includes(id),

      /**
       * Retorna quantos alertas da lista ainda não foram vistos.
       * Recebe o array de alertas gerado pela AlertasScreen.
       */
      countUnseen: (alertas) => {
        if (!alertas || !Array.isArray(alertas)) return 0;
        const seen = new Set(get().seenIds);
        return alertas.filter((a) => !seen.has(a.id)).length;
      },

      /** Limpa todo o histórico (útil para testes / reset) */
      clearSeen: () => set({ seenIds: [] }),
    }),
    {
      name: 'sigs-alerts-seen',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
