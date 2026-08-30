import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEstabelecimentosStore } from '../store/estabelecimentosStore';
import { getTipoLicencaConfig, formatDate, getDaysUntilExpiry, formatCNPJ } from '../utils/formatters';
import { calcularRisco, COR_CLASSES } from '../utils/licencaRisco';
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
  Siren,
  OctagonAlert,
  Scale,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CalendarSyncModal } from '../components/modals/CalendarSyncModal';

// ─── helpers ────────────────────────────────────────────────────────────────
const RISK_META = {
  vermelho: { label: 'Crítico',   icon: Siren,          gradient: 'from-rose-600 to-rose-500',   ring: 'ring-rose-500/30',   bg: 'bg-rose-50 dark:bg-rose-950/40',   text: 'text-rose-700 dark:text-rose-300',   border: 'border-rose-200 dark:border-rose-900/60' },
  laranja:  { label: 'Irregular', icon: OctagonAlert,   gradient: 'from-orange-500 to-amber-500', ring: 'ring-orange-500/30', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-900/60' },
  amarelo:  { label: 'Atenção',   icon: AlertTriangle,  gradient: 'from-amber-500 to-yellow-400', ring: 'ring-amber-500/30',  bg: 'bg-amber-50 dark:bg-amber-950/40',  text: 'text-amber-700 dark:text-amber-300',  border: 'border-amber-200 dark:border-amber-900/60' },
};

function RiskRow({ lic, onSync, navigate }) {
  const est    = lic._est;
  const config = getTipoLicencaConfig(lic.tipoLicenca);
  const risco  = lic.risco;
  const cls    = COR_CLASSES[risco.cor];
  const meta   = RISK_META[risco.cor];
  const Icon   = meta?.icon ?? AlertTriangle;

  return (
    <div
      className={`group relative flex items-center gap-4 p-4 rounded-2xl border ${cls.border} ${cls.bg} transition-all hover:shadow-sm cursor-pointer`}
      onClick={() => navigate(`/licencas/${lic._id}`)}
    >
      {/* left stripe */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b ${meta?.gradient ?? 'from-gray-400 to-gray-300'}`} />

      {/* icon badge */}
      <div className={`ml-2 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cls.bg} ring-2 ${meta?.ring ?? 'ring-gray-200/30'}`}>
        <Icon className={`w-5 h-5 ${cls.icon}`} />
      </div>

      {/* text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-[#00796B] dark:group-hover:text-teal-400 transition-colors">
            {config.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls.badge}`}>
            {risco.corLabel}
          </span>
          {risco.peso === 'alto' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              Peso Alto
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          {est ? est.nome : '—'}
          {lic.dataVencimento ? ` · Vence ${formatDate(lic.dataVencimento)}` : ''}
          {' · '}<span className="italic">{risco.situacaoLabel}</span>
        </p>
        {risco.lei && (
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
            <Scale className="w-3 h-3 flex-shrink-0" />
            {risco.lei}
            {risco.presumido && <span className="italic">(presumido)</span>}
          </p>
        )}
      </div>

      {/* right actions */}
      <div
        className="flex items-center gap-1 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onSync(lic)}
          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-colors"
        >
          Sincronizar
        </button>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#00796B] transition-colors ml-1" />
      </div>
    </div>
  );
}

// ─── main component ─────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const rawLicencas    = useQuery(api.licencas.listAll)    ?? [];
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const { estabelecimentoAtual } = useEstabelecimentosStore();

  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [selectedSyncLicenca, setSelectedSyncLicenca] = useState(null);
  const [solicitou, setSolicitou] = useState(user?.solicitouLeitura || false);

  const isRestrito = user && !user.podeLerTodos && user.role !== 'Administrador' && user.email !== 'fiscal@sigs.gov.br';

  const estMap = useMemo(() => {
    const map = new Map();
    (estabelecimentos || []).forEach((e) => { if (e?._id) map.set(e._id, e); });
    return map;
  }, [estabelecimentos]);

  const filteredLicencas = useMemo(() => {
    if (!rawLicencas) return [];
    if (!estabelecimentoAtual) return rawLicencas;
    return rawLicencas.filter((l) => l && l.estabelecimentoId === estabelecimentoAtual);
  }, [rawLicencas, estabelecimentoAtual]);

  const stats = useMemo(() => {
    let semRisco = 0, atencao = 0, critico = 0;
    (filteredLicencas || []).forEach((l) => {
      if (!l) return;
      const r = calcularRisco(l);
      if (r.grupo === 'semRisco')   semRisco++;
      else if (r.grupo === 'atencao') atencao++;
      else                            critico++;
    });
    const total = (filteredLicencas || []).length;
    const pct   = total > 0 ? Math.round((semRisco / total) * 100) : 100;
    return { total, semRisco, atencao, critico, pct };
  }, [filteredLicencas]);

  const urgentLicencas = useMemo(() => {
    return (filteredLicencas || [])
      .filter((l) => l)
      .map((l) => ({
        ...l,
        _est:  estMap.get(l.estabelecimentoId),
        risco: calcularRisco(l),
        days:  l.dataVencimento ? getDaysUntilExpiry(l.dataVencimento) : null,
      }))
      .filter((l) => l.risco.cor !== 'verde' && l.risco.cor !== 'cinza')
      .sort((a, b) => {
        const ord = { vermelho: 0, laranja: 1, amarelo: 2 };
        const d = (ord[a.risco.cor] ?? 3) - (ord[b.risco.cor] ?? 3);
        return d !== 0 ? d : (a.days ?? 999) - (b.days ?? 999);
      })
      .slice(0, 8);
  }, [filteredLicencas, estMap]);

  // group urgent list by risk color for section headers
  const urgentGroups = useMemo(() => {
    const groups = {};
    urgentLicencas.forEach((l) => {
      if (!groups[l.risco.cor]) groups[l.risco.cor] = [];
      groups[l.risco.cor].push(l);
    });
    return groups;
  }, [urgentLicencas]);

  const now = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1 capitalize">{now}</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Painel de Conformidade
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Monitoramento em tempo real · Risco calculado por peso regulatório
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedSyncLicenca(null); setSyncModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors shadow-xs"
          >
            <CalendarPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Sincronizar Agenda
          </button>
          <button
            onClick={() => navigate('/licencas')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-semibold text-sm text-gray-800 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Search className="w-4 h-4 text-gray-500" />
            Licenças
          </button>
        </div>
      </div>

      {/* ── Compliance score banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#004D40] via-[#00796B] to-[#00897B] p-6 text-white shadow-md">
        {/* decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-200">Índice de Conformidade</p>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-5xl font-black">{stats.pct}%</span>
              <span className="text-teal-200 text-sm mb-1.5">dos documentos sem risco</span>
            </div>
            {/* progress bar */}
            <div className="mt-3 h-2 w-64 max-w-full bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </div>

          {/* mini KPI row inside banner */}
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Crítico',   value: stats.critico,  color: 'bg-rose-400/80'   },
              { label: 'Atenção',   value: stats.atencao,  color: 'bg-amber-400/80'  },
              { label: 'Sem risco', value: stats.semRisco, color: 'bg-emerald-400/80'},
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <div>
                  <p className="text-[10px] font-bold text-teal-100 uppercase tracking-wider">{label}</p>
                  <p className="text-xl font-black">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Total</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-0.5">{stats.total}</h3>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-teal-500" /> Documentos
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#00796B] dark:text-teal-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Sem risco */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Sem risco</p>
            <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{stats.semRisco}</h3>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">Em conformidade</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Atenção */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Atenção</p>
            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.atencao}</h3>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mt-0.5">A vencer / Protocolado</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Crítico */}
        <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
          stats.critico > 0
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
            : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
        }`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${stats.critico > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-zinc-500'}`}>Crítico</p>
            <h3 className={`text-3xl font-black mt-0.5 ${stats.critico > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-gray-900 dark:text-white'}`}>{stats.critico}</h3>
            <p className={`text-[11px] mt-0.5 ${stats.critico > 0 ? 'text-rose-600/80 dark:text-rose-400/70' : 'text-gray-400 dark:text-zinc-500'}`}>
              {stats.critico > 0 ? 'Risco de interdição' : 'Sem pendências críticas'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${stats.critico > 0 ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500'}`}>
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: alert list (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs overflow-hidden">
          {/* card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                <Siren className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h2 className="font-bold text-base text-gray-900 dark:text-white">Documentos em Alerta</h2>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">Ordenados por gravidade real · peso regulatório</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/alertas')}
              className="flex items-center gap-1 text-xs font-bold text-[#00796B] dark:text-teal-400 hover:underline"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            {urgentLicencas.length === 0 ? (
              <div className="py-14 text-center">
                <ShieldCheck className="w-14 h-14 mx-auto mb-3 text-emerald-500 opacity-70" />
                <p className="font-bold text-gray-700 dark:text-zinc-200">Tudo em conformidade!</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Nenhum documento com risco relevante identificado.</p>
              </div>
            ) : (
              <>
                {/* render by severity group */}
                {['vermelho', 'laranja', 'amarelo'].map((cor) => {
                  const group = urgentGroups[cor];
                  if (!group || group.length === 0) return null;
                  const meta = RISK_META[cor];
                  const Icon = meta.icon;
                  return (
                    <div key={cor} className="space-y-2">
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${meta.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${meta.text}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${meta.text}`}>
                          {meta.label} — {group.length} documento{group.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      {group.map((lic) => (
                        <RiskRow
                          key={lic._id}
                          lic={lic}
                          navigate={navigate}
                          onSync={(l) => { setSelectedSyncLicenca(l); setSyncModalOpen(true); }}
                        />
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Right: establishments */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#00796B] dark:text-teal-400" />
              </div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Estabelecimentos</h2>
            </div>
            <button
              onClick={() => navigate('/estabelecimentos')}
              className="text-xs font-bold text-[#00796B] dark:text-teal-400 hover:underline"
            >
              Gerenciar
            </button>
          </div>

          <div className="p-4 space-y-2">
            {estabelecimentos.length === 0 ? (
              <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-8">Nenhum estabelecimento cadastrado.</p>
            ) : (
              estabelecimentos.slice(0, 5).map((est) => {
                // count risk for this establishment
                const lics = (filteredLicencas || []).filter((l) => l && l.estabelecimentoId === est._id);
                const temCritico = lics.some((l) => calcularRisco(l).cor === 'vermelho' || calcularRisco(l).cor === 'laranja');
                const temAtencao = !temCritico && lics.some((l) => calcularRisco(l).cor === 'amarelo');

                return (
                  <div
                    key={est._id}
                    onClick={() => navigate('/estabelecimentos')}
                    className="group p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/80 dark:hover:bg-zinc-800/60 cursor-pointer transition-all flex items-center gap-3"
                  >
                    {/* status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      temCritico ? 'bg-rose-500' : temAtencao ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-[#00796B] dark:group-hover:text-teal-400 transition-colors">
                        {est.nome}
                      </h4>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                        {formatCNPJ(est.cnpj)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[10px] font-bold ${
                        temCritico ? 'text-rose-600 dark:text-rose-400'
                        : temAtencao ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {temCritico ? 'Crítico' : temAtencao ? 'Atenção' : 'Regular'}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500">{lics.length} doc.</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* legend */}
          <div className="px-4 pb-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">Legenda de risco</p>
              {[
                { color: 'bg-rose-500',    label: 'Crítico — risco de interdição' },
                { color: 'bg-amber-500',   label: 'Atenção — a vencer / protocolado' },
                { color: 'bg-emerald-500', label: 'Regular — todos em conformidade' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-[11px] text-gray-500 dark:text-zinc-400">{label}</span>
                </div>
              ))}
            </div>
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
