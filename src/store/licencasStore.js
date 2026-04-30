import { create } from 'zustand';
import { DatabaseService, initDatabase } from '../database/database';

// Initialize DB on first import
initDatabase();

export const useLicencasStore = create((set, get) => ({
  licencas: [],
  searchQuery: '',
  filterTipo: 'todas',
  filterStatus: 'todas',

  loadLicencas: () => {
    try {
      const data = DatabaseService.getLicencas();
      console.log('Licenças carregadas com sucesso:', data.length);
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
      console.log('Licença salva no banco com sucesso:', licenca.id);
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
      const matchesSearch =
        l.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.codigo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTipo = filterTipo === 'todas' || l.tipo === filterTipo;
      const matchesStatus = filterStatus === 'todas' || l.status === filterStatus;
      return matchesSearch && matchesTipo && matchesStatus;
    });
  },
}));
