import { create } from 'zustand';
import { DatabaseService, initDatabase } from '../database/database';

initDatabase();

export const useEstabelecimentosStore = create((set, get) => ({
  estabelecimentos: [],
  estabelecimentoAtual: null,

  loadEstabelecimentos: () => {
    try {
      const data = DatabaseService.getEstabelecimentos();
      set({ estabelecimentos: data });
    } catch (error) {
      console.error('Erro ao carregar estabelecimentos:', error);
    }
  },

  addEstabelecimento: (est) => {
    try {
      DatabaseService.addEstabelecimento(est);
      set((state) => ({ estabelecimentos: [...state.estabelecimentos, est] }));
    } catch (error) {
      console.error('Erro ao salvar estabelecimento:', error);
      throw error;
    }
  },

  updateEstabelecimento: (id, updates) => {
    try {
      DatabaseService.updateEstabelecimento(id, updates);
      set((state) => ({
        estabelecimentos: state.estabelecimentos.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
        estabelecimentoAtual:
          state.estabelecimentoAtual?.id === id
            ? { ...state.estabelecimentoAtual, ...updates }
            : state.estabelecimentoAtual,
      }));
    } catch (error) {
      console.error('Erro ao atualizar estabelecimento:', error);
      throw error;
    }
  },

  deleteEstabelecimento: (id) => {
    try {
      DatabaseService.deleteEstabelecimento(id);
      set((state) => ({
        estabelecimentos: state.estabelecimentos.filter((e) => e.id !== id),
        estabelecimentoAtual:
          state.estabelecimentoAtual?.id === id ? null : state.estabelecimentoAtual,
      }));
    } catch (error) {
      console.error('Erro ao excluir estabelecimento:', error);
      throw error;
    }
  },

  setEstabelecimentoAtual: (est) => {
    set({ estabelecimentoAtual: est });
  },
}));
