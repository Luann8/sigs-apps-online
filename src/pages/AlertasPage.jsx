import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getDaysUntilExpiry, getTipoLicencaConfig, formatDate, formatCNPJ } from '../utils/formatters';
import {
  generateGoogleCalendarUrl,
  generateOutlookWebUrl,
  generateOffice365Url,
  downloadICSFile,
} from '../utils/calendarExport';
import {
  AlertTriangle,
  CalendarPlus,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function AlertasPage() {
  const navigate = useNavigate();
  const rawLicencas = useQuery(api.licencas.listAll) ?? [];
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];

  const [filterDays, setFilterDays] = useState(30);

  const estMap = useMemo(() => {
    const m = new Map();
    estabelecimentos.forEach((e) => m.set(e._id, e));
    return m;
  }, [estabelecimentos]);

  const alertas = useMemo(() => {
    return rawLicencas
      .map((l) => ({ ...l, days: getDaysUntilExpiry(l.dataVencimento) }))
      .filter((l) => l.days <= filterDays)
      .sort((a, b) => a.days - b.days);
  }, [rawLicencas, filterDays]);

  const vencidas = alertas.filter((l) => l.days < 0);
  const vencendo = alertas.filter((l) => l.days >= 0);

  const handleExportAll = () => {
    if (alertas.length === 0) {
      toast.error('Nenhum alerta para exportar.');
      return;
    }
    const events = alertas.map((lic) => {
      const config = getTipoLicencaConfig(lic.tipoLicenca);
      const est = estMap.get(lic.estabelecimentoId);
      return {
        title: `[SIGS] Vencimento: ${config.label} (${lic.codigo})`,
        description: `Estabelecimento: ${est?.nome || 'N/A'}\nCNPJ: ${est?.cnpj || 'N/A'}\nData de Vencimento: ${formatDate(lic.dataVencimento)}`,
        dateStr: lic.dataVencimento,
        location: est?.endereco || '',
      };
    });
    downloadICSFile(events, `sigs-alertas-${new Date().toISOString().slice(0, 10)}.ics`);
    toast.success(`${events.length} alertas exportados em arquivo iCal!`);
  };

  const handleSyncOne = (lic, provider) => {
    const config = getTipoLicencaConfig(lic.tipoLicenca);
    const est = estMap.get(lic.estabelecimentoId);
    const payload = {
      title: `[SIGS] Vencimento: ${config.label} (${lic.codigo})`,
      description: `Estabelecimento: ${est?.nome || 'N/A'}\nCNPJ: ${est?.cnpj || 'N/A'}\nVencimento: ${formatDate(lic.dataVencimento)}`,
      dateStr: lic.dataVencimento,
      location: est?.endereco || '',
    };

    if (provider === 'google') {
      window.open(generateGoogleCalendarUrl(payload), '_blank');
    } else if (provider === 'outlook') {
      window.open(generateOutlookWebUrl(payload), '_blank');
    } else if (provider === 'office365') {
      window.open(generateOffice365Url(payload), '_blank');
    } else if (provider === 'ics') {
      downloadICSFile([payload], `vencimento-${lic.codigo}.ics`);
      toast.success('Arquivo .ics baixado!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Alertas & Exportar para Calendário
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Sincronize vencimentos críticos com Google Calendar, Outlook ou Apple Calendar
          </p>
        </div>

        <button
          onClick={handleExportAll}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#00796B] hover:bg-[#004D40] text-white font-bold rounded-xl shadow-sm transition-all text-sm"
        >
          <Download className="w-5 h-5" />
          <span>Exportar Todos (.ics)</span>
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Mostrar vencimentos em:</span>
        {[7, 15, 30, 60, 90].map((d) => (
          <button
            key={d}
            onClick={() => setFilterDays(d)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterDays === d
                ? 'bg-[#00796B] text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400'
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      {/* Summary banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 flex items-center space-x-3">
          <XCircle className="w-8 h-8 text-rose-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase">Vencidas</p>
            <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{vencidas.length}</p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex items-center space-x-3">
          <Clock className="w-8 h-8 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">Vencendo em {filterDays}d</p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{vencendo.length}</p>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-2xl p-4 flex items-center space-x-3">
          <CalendarPlus className="w-8 h-8 text-indigo-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Total de Alertas</p>
            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{alertas.length}</p>
          </div>
        </div>
      </div>

      {alertas.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-12 text-center space-y-3">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto opacity-80" />
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Tudo em dia!</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Nenhuma licença vencida ou vencendo nos próximos {filterDays} dias.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-gray-900 dark:text-white">
              {alertas.length} alerta{alertas.length !== 1 ? 's' : ''} — Clique para sincronizar com seu calendário
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {alertas.map((lic) => {
              const est = estMap.get(lic.estabelecimentoId);
              const config = getTipoLicencaConfig(lic.tipoLicenca);
              const isExpired = lic.days < 0;

              return (
                <div key={lic._id} className="p-4 sm:p-5 hover:bg-gray-50/60 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Status badge + info */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                        isExpired
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : lic.days <= 7
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {isExpired ? 'EXP' : `${lic.days}d`}
                      </div>

                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => navigate(`/licencas/${lic._id}`)}
                          className="text-left block hover:text-[#00796B] dark:hover:text-teal-400 transition-colors"
                        >
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {config.label} ({lic.codigo})
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                            {est ? `${est.nome} • ${formatCNPJ(est.cnpj)}` : 'Estabelecimento não vinculado'}
                          </p>
                          <p className="text-xs font-semibold text-gray-600 dark:text-zinc-300 mt-0.5">
                            Vence em: {formatDate(lic.dataVencimento)}
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Calendar sync buttons */}
                    <div className="flex items-center flex-wrap gap-1.5 sm:flex-shrink-0">
                      <button
                        onClick={() => handleSyncOne(lic, 'google')}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] hover:bg-blue-100 transition-colors flex items-center space-x-1 border border-blue-200 dark:border-blue-900"
                        title="Adicionar ao Google Calendar"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Google Cal</span>
                      </button>

                      <button
                        onClick={() => handleSyncOne(lic, 'outlook')}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-[10px] hover:bg-sky-100 transition-colors flex items-center space-x-1 border border-sky-200 dark:border-sky-900"
                        title="Adicionar ao Outlook"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Outlook</span>
                      </button>

                      <button
                        onClick={() => handleSyncOne(lic, 'office365')}
                        className="px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold text-[10px] hover:bg-orange-100 transition-colors flex items-center space-x-1 border border-orange-200 dark:border-orange-900"
                        title="Adicionar ao Office 365"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Office 365</span>
                      </button>

                      <button
                        onClick={() => handleSyncOne(lic, 'ics')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] hover:bg-emerald-100 transition-colors flex items-center space-x-1 border border-emerald-200 dark:border-emerald-900"
                        title="Baixar arquivo .ics"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>iCal</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
