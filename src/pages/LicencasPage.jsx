import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEstabelecimentosStore } from '../store/estabelecimentosStore';
import {
  getTipoLicencaConfig,
  getStatusConfig,
  formatDate,
  getDaysUntilExpiry,
  formatCNPJ,
} from '../utils/formatters';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit3,
  Eye,
  Calendar,
  Building2,
  ExternalLink,
  CalendarPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CadastroModal } from '../components/modals/CadastroModal';
import { CalendarSyncModal } from '../components/modals/CalendarSyncModal';
import { downloadCSV } from '../utils/backupHelper';
import { toast } from 'sonner';

export function LicencasPage() {
  const navigate = useNavigate();
  const rawLicencas = useQuery(api.licencas.listAll) ?? [];
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const removeMutation = useMutation(api.licencas.remove);
  const { estabelecimentoAtual } = useEstabelecimentosStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todas');
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [editLicenca, setEditLicenca] = useState(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [selectedSyncLicenca, setSelectedSyncLicenca] = useState(null);

  const estMap = useMemo(() => {
    const map = new Map();
    estabelecimentos.forEach((e) => map.set(e._id, e));
    return map;
  }, [estabelecimentos]);

  const filteredLicencas = useMemo(() => {
    return rawLicencas.filter((l) => {
      if (estabelecimentoAtual && l.estabelecimentoId !== estabelecimentoAtual) {
        return false;
      }

      const config = getTipoLicencaConfig(l.tipoLicenca);
      const est = estMap.get(l.estabelecimentoId);
      const searchLower = search.toLowerCase();
      const matchesSearch =
        (l.codigo || '').toLowerCase().includes(searchLower) ||
        (config.label || '').toLowerCase().includes(searchLower) ||
        (est?.nome || '').toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      const days = getDaysUntilExpiry(l.dataVencimento);
      if (filterStatus === 'ativas') return l.status === 'ativa' && days > 30;
      if (filterStatus === 'vencendo') return days <= 30 && days >= 0;
      if (filterStatus === 'vencidas') return l.status === 'vencida' || days < 0;
      if (filterStatus === 'pendentes') return l.status === 'pendente';

      return true;
    });
  }, [rawLicencas, estabelecimentoAtual, search, filterStatus, estMap]);

  const handleDelete = async (id, codigo) => {
    if (!window.confirm(`Deseja realmente remover a licença ${codigo}?`)) return;
    try {
      await removeMutation({ id });
      toast.success(`Licença ${codigo} removida.`);
    } catch (err) {
      toast.error('Erro ao remover licença: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredLicencas.map((l) => {
      const est = estMap.get(l.estabelecimentoId);
      const config = getTipoLicencaConfig(l.tipoLicenca);
      return {
        Codigo: l.codigo,
        Tipo: config.label,
        Estabelecimento: est ? est.nome : '',
        CNPJ: est ? est.cnpj : '',
        Status: l.status,
        Emissao: l.dataEmissao,
        Vencimento: l.dataVencimento,
        Custo: l.custo || 0,
      };
    });
    downloadCSV(dataToExport, `licencas-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Relatório CSV exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Gerenciamento de Licenças
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Alvarás, licenças ambientais e termos técnicos registrados
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSelectedSyncLicenca(null);
              setSyncModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors shadow-xs"
          >
            <CalendarPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Sincronizar Agenda</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => {
              setEditLicenca(null);
              setCadastroOpen(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#00796B] hover:bg-[#004D40] text-white font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Licença</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrar por código, documento ou estabelecimento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'ativas', label: 'Ativas' },
            { id: 'vencendo', label: 'Vencendo (30d)' },
            { id: 'vencidas', label: 'Vencidas' },
            { id: 'pendentes', label: 'Pendentes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-[#00796B] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Web Table View */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                <th className="py-4 px-6">Código / Documento</th>
                <th className="py-4 px-6">Estabelecimento</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Vencimento</th>
                <th className="py-4 px-6">Custo</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-sm">
              {filteredLicencas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">Nenhuma licença encontrada.</p>
                  </td>
                </tr>
              ) : (
                filteredLicencas.map((lic) => {
                  const est = estMap.get(lic.estabelecimentoId);
                  const config = getTipoLicencaConfig(lic.tipoLicenca);
                  const days = getDaysUntilExpiry(lic.dataVencimento);
                  const isExpired = days < 0;
                  const isSoon = days <= 30 && days >= 0;

                  return (
                    <tr
                      key={lic._id}
                      className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/60 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/licencas/${lic._id}`)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-[#00796B] dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                            {lic.codigo}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-[#00796B] transition-colors">
                              {config.label}
                            </p>
                            {lic.anexoUri && (
                              <span className="text-[11px] text-teal-600 dark:text-teal-400 flex items-center mt-0.5">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Anexo vinculado
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-medium text-gray-800 dark:text-zinc-200">
                        {est ? (
                          <div>
                            <p className="font-semibold">{est.nome}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{formatCNPJ(est.cnpj)}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">Não vinculado</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isExpired
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isSoon
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isExpired ? 'Vencida' : isSoon ? `Vence em ${days}d` : 'Ativa'}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-semibold text-gray-700 dark:text-zinc-300">
                        {formatDate(lic.dataVencimento)}
                      </td>

                      <td className="py-4 px-6 font-medium text-gray-700 dark:text-zinc-300">
                        {lic.custo ? `R$ ${lic.custo.toFixed(2)}` : '-'}
                      </td>

                      <td
                        className="py-4 px-6 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setSelectedSyncLicenca(lic);
                            setSyncModalOpen(true);
                          }}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          title="Sincronizar com Agenda"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/licencas/${lic._id}`)}
                          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditLicenca(lic);
                            setCadastroOpen(true);
                          }}
                          className="p-2 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lic._id, lic.codigo)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {cadastroOpen && (
        <CadastroModal
          isOpen={cadastroOpen}
          onClose={() => {
            setCadastroOpen(false);
            setEditLicenca(null);
          }}
          editLicenca={editLicenca}
        />
      )}

      {syncModalOpen && (
        <CalendarSyncModal
          isOpen={syncModalOpen}
          onClose={() => setSyncModalOpen(false)}
          licenca={selectedSyncLicenca}
          licencas={filteredLicencas}
          estabelecimentos={estabelecimentos}
        />
      )}
    </div>
  );
}
