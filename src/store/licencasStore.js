import { create } from 'zustand';

export const useLicencasStore = create((set, get) => ({
  searchQuery: '',
  filterTipo: 'todas',
  filterStatus: 'todas',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterTipo: (filterTipo) => set({ filterTipo }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),

  getFilteredLicencas: (licencas) => {
    const { searchQuery, filterTipo, filterStatus } = get();
    if (!licencas) return [];
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
