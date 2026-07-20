import { create } from 'zustand';
import { DatabaseService } from '../database/database';

export const useLicencasStore = create((set, get) => ({
  licencas: [],
  searchQuery: '',
  filterTipo: 'todas',
  filterStatus: 'todas',

  loadLicencas: (estabelecimentoId) => {
    if (!estabelecimentoId) {
      set({ licencas: [] });
      return;
    }
    try {
      const data = DatabaseService.getLicencas(estabelecimentoId);
      set({ licencas: data });
    } catch (error) {
      console.error('Erro crítico ao carregar as licenças:', error);
    }
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterTipo: (filterTipo) => set({ filterTipo }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),

  addLicenca: (licenca) => {
    try {
      DatabaseService.addLicenca(licenca);
      set((state) => ({ licencas: [licenca, ...state.licencas] }));
    } catch (error) {
      console.error('Erro crítico ao salvar licença no banco:', error);
      throw error;
    }
  },

  updateLicenca: (id, updates) => {
    DatabaseService.updateLicenca(id, updates);
    set((state) => ({
      licencas: state.licencas.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  },

  deleteLicenca: (id) => {
    try {
      DatabaseService.deleteLicenca(id);
      set((state) => ({
        licencas: state.licencas.filter((l) => l.id !== id),
      }));
    } catch (error) {
      console.error('Erro ao excluir licença do banco:', error);
      throw error;
    }
  },

  getLicencaById: (id) => {
    return get().licencas.find((l) => l.id === id);
  },

  getFilteredLicencas: () => {
    const { licencas, searchQuery, filterTipo, filterStatus } = get();
    return licencas.filter((l) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        (l.tipoLicenca || '').toLowerCase().includes(searchLower) ||
        (l.codigo || '').toLowerCase().includes(searchLower);
      const matchesTipo = filterTipo === 'todas' || l.tipoLicenca === filterTipo;
      const matchesStatus = filterStatus === 'todas' || l.status === filterStatus;
      return matchesSearch && matchesTipo && matchesStatus;
    });
  },
}));
