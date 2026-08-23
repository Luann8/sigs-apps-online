import { create } from 'zustand';

export const useEstabelecimentosStore = create((set) => ({
  estabelecimentoAtual: null,

  setEstabelecimentoAtual: (est) => set({ estabelecimentoAtual: est }),
}));
