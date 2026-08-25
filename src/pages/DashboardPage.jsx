import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEstabelecimentosStore } from '../store/estabelecimentosStore';
import { getDaysUntilExpiry, getTipoLicencaConfig, formatDate, formatCNPJ } from '../utils/formatters';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Search,
  CalendarPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CalendarSyncModal } from '../components/modals/CalendarSyncModal';
import { toast } from 'sonner';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const rawLicencas = useQuery(api.licencas.listAll) ?? [];
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const { estabelecimentoAtual } = useEstabelecimentosStore();

  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [selectedSyncLicenca, setSelectedSyncLicenca] = useState(null);
  const [solicitou, setSolicitou] = useState(user?.solicitouLeitura || false);

  const isRestrito = user && !user.podeLerTodos && user.role !== 'Administrador' && user.email !== 'fiscal@sigs.gov.br';

  const estMap = useMemo(() => {
    const map = new Map();
    (estabelecimentos || []).forEach((e) => {
      if (e && e._id) map.set(e._id, e);
    });
    return map;
  }, [estabelecimentos]);

  const filteredLicencas = useMemo(() => {
    if (!rawLicencas) return [];
    if (!estabelecimentoAtual) return rawLicencas;
    return rawLicencas.filter((l) => l && l.estabelecimentoId === estabelecimentoAtual);
  }, [rawLicencas, estabelecimentoAtual]);

  const stats = useMemo(() => {
    let ativas = 0;
    let vencendo = 0;
    let vencidas = 0;

    (filteredLicencas || []).forEach((l) => {
      if (!l || !l.dataVencimento) return;
      const days = getDaysUntilExpiry(l.dataVencimento);
      if (l.status === 'vencida' || days < 0) {
        vencidas++;
      } else if (days <= 30) {
        vencendo++;
      } else if (l.status === 'ativa') {
        ativas++;
      }
    });

    return { total: (filteredLicencas || []).length, ativas, vencendo, vencidas };
  }, [filteredLicencas]);

  const urgentLicencas = useMemo(() => {
    return (filteredLicencas || [])
      .filter((l) => l && l.dataVencimento)
      .map((l) => ({
        ...l,
        days: getDaysUntilExpiry(l.dataVencimento),
      }))
      .filter((l) => l.days <= 30)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [filteredLicencas]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Visão Geral do Sistema
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Monitoramento em tempo real de licenças, alvarás e regularidade sanitária
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
            onClick={() => navigate('/licencas')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-semibold text-sm text-gray-800 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Search className="w-4 h-4 text-gray-500" />
            <span>Buscar Licença</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Card */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Total de Licenças</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600 mr-1" />
              Documentos registrados
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#00796B] dark:text-teal-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Regular / Ativas */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Licenças Ativas</p>
            <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stats.ativas}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Em conformidade</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Vencendo Em Breve */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Vencendo (30d)</p>
            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.vencendo}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Requer atenção</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Vencidas */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Licenças Vencidas</p>
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.vencidas}</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">Ação imediata</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Alerts & Estabelecimentos Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Urgent License Expirations (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Alvarás Próximos do Vencimento</h2>
            </div>
            <button
              onClick={() => navigate('/alertas')}
              className="text-xs font-bold text-[#00796B] dark:text-teal-400 hover:underline flex items-center"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {urgentLicencas.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-zinc-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-80" />
              <p className="font-semibold text-gray-700 dark:text-zinc-300">Tudo em dia!</p>
              <p className="text-xs">Nenhuma licença com vencimento crítico nos próximos 30 dias.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentLicencas.map((lic) => {
                const est = estMap.get(lic.estabelecimentoId);
                const config = getTipoLicencaConfig(lic.tipoLicenca);
                const days = lic.days;
                const isExpired = days < 0;

                return (
                  <div
                    key={lic._id}
                    className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/40 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div
                      onClick={() => navigate(`/licencas/${lic._id}`)}
                      className="flex items-center space-x-3 flex-1"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isExpired
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {isExpired ? 'VENCIDA' : `${days}d`}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#00796B] dark:group-hover:text-teal-400 transition-colors">
                          {config.label} ({lic.codigo})
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {est ? est.nome : 'Empresa'} • Vence em: {formatDate(lic.dataVencimento)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSyncLicenca(lic);
                          setSyncModalOpen(true);
                        }}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100"
                        title="Sincronizar com Agenda"
                      >
                        Sincronizar
                      </button>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#00796B] dark:group-hover:text-teal-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Registered Establishments & Quick Actions */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#00796B] dark:text-teal-400" />
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Estabelecimentos</h2>
            </div>
            <button
              onClick={() => navigate('/estabelecimentos')}
              className="text-xs font-bold text-[#00796B] dark:text-teal-400 hover:underline"
            >
              Gerenciar
            </button>
          </div>

          <div className="space-y-3">
            {estabelecimentos.slice(0, 4).map((est) => (
              <div
                key={est._id}
                onClick={() => navigate('/estabelecimentos')}
                className="p-3 rounded-xl border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{est.nome}</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400">CNPJ: {formatCNPJ(est.cnpj)}</p>
                <p className="text-xs text-[#00796B] dark:text-teal-400 font-medium mt-1">
                  Resp: {est.responsavel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

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
