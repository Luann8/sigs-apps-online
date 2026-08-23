import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEstabelecimentosStore } from '../store/estabelecimentosStore';
import { getTipoLicencaConfig, formatDate, getDaysUntilExpiry } from '../utils/formatters';
import {
  generateGoogleCalendarUrl,
  generateOutlookWebUrl,
  downloadICSFile,
} from '../utils/calendarExport';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Plus,
  CheckCircle2,
  Trash2,
  Clock,
  X,
  AlertTriangle,
  CalendarPlus,
  Download,
  Bell,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function CalendarioPage() {
  const navigate = useNavigate();
  const rawLicencas = useQuery(api.licencas.listAll) ?? [];
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const dbEventos = useQuery(api.eventos.listAll) ?? [];

  const addEventoMutation = useMutation(api.eventos.add);
  const toggleConcluidoMutation = useMutation(api.eventos.toggleConcluido);
  const removeEventoMutation = useMutation(api.eventos.remove);

  const { estabelecimentoAtual } = useEstabelecimentosStore();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [novoEventoOpen, setNovoEventoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dia'); // 'dia' | 'alertas'

  // Form state for new event
  const [tituloEvento, setTituloEvento] = useState('');
  const [tipoEvento, setTipoEvento] = useState('vistoria');
  const [descricaoEvento, setDescricaoEvento] = useState('');
  const [dataEventoForm, setDataEventoForm] = useState(selectedDateStr);

  const estMap = useMemo(() => {
    const m = new Map();
    estabelecimentos.forEach((e) => m.set(e._id, e));
    return m;
  }, [estabelecimentos]);

  const filteredLicencas = useMemo(() => {
    if (!estabelecimentoAtual) return rawLicencas;
    return rawLicencas.filter((l) => l.estabelecimentoId === estabelecimentoAtual);
  }, [rawLicencas, estabelecimentoAtual]);

  // Build dateMap: date -> { licencas[], eventos[] }
  const dateMap = useMemo(() => {
    const m = new Map();

    filteredLicencas.forEach((l) => {
      if (!l.dataVencimento) return;
      const key = l.dataVencimento;
      if (!m.has(key)) m.set(key, { licencas: [], eventos: [] });
      m.get(key).licencas.push(l);
    });

    (dbEventos || []).forEach((ev) => {
      if (!ev.data) return;
      if (!m.has(ev.data)) m.set(ev.data, { licencas: [], eventos: [] });
      m.get(ev.data).eventos.push(ev);
    });

    return m;
  }, [filteredLicencas, dbEventos]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const selectedDayData = dateMap.get(selectedDateStr) || { licencas: [], eventos: [] };

  // Upcoming alerts (next 30 days)
  const alertas = useMemo(() => {
    return filteredLicencas
      .map((l) => ({ ...l, days: getDaysUntilExpiry(l.dataVencimento) }))
      .filter((l) => l.days <= 30)
      .sort((a, b) => a.days - b.days);
  }, [filteredLicencas]);

  const handleAddEvento = async (e) => {
    e.preventDefault();
    if (!tituloEvento.trim()) { toast.error('Informe o título.'); return; }
    try {
      await addEventoMutation({
        titulo: tituloEvento.trim(),
        data: dataEventoForm,
        tipo: tipoEvento,
        descricao: descricaoEvento || undefined,
        estabelecimentoId: estabelecimentoAtual || undefined,
        concluido: false,
      });
      toast.success('Evento salvo!');
      setTituloEvento('');
      setDescricaoEvento('');
      setNovoEventoOpen(false);
    } catch (err) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleToggle = async (id) => {
    try { await toggleConcluidoMutation({ id }); } catch { toast.error('Erro ao atualizar.'); }
  };

  const handleRemove = async (id) => {
    try { await removeEventoMutation({ id }); toast.success('Removido.'); } catch { toast.error('Erro.'); }
  };

  // Calendar export helpers
  const buildPayload = (lic) => {
    const config = getTipoLicencaConfig(lic.tipoLicenca);
    const est = estMap.get(lic.estabelecimentoId);
    return {
      title: `[SIGS] Vencimento: ${config.label} (${lic.codigo})`,
      description: `Estabelecimento: ${est?.nome || 'N/A'}\nCNPJ: ${est?.cnpj || 'N/A'}\nVencimento: ${formatDate(lic.dataVencimento)}`,
      dateStr: lic.dataVencimento,
      location: est?.endereco || '',
    };
  };

  const syncGoogle = (lic) => window.open(generateGoogleCalendarUrl(buildPayload(lic)), '_blank');
  const syncOutlook = (lic) => window.open(generateOutlookWebUrl(buildPayload(lic)), '_blank');
  const syncICS = (lic) => {
    downloadICSFile([buildPayload(lic)], `vencimento-${lic.codigo}.ics`);
    toast.success('Arquivo .ics baixado!');
  };

  const exportAllICS = () => {
    if (alertas.length === 0) { toast.error('Nenhum alerta para exportar.'); return; }
    downloadICSFile(alertas.map(buildPayload), 'sigs-alertas.ics');
    toast.success(`${alertas.length} alertas exportados!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Calendário & Alertas
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Vencimentos de licenças, lembretes e sincronização com calendários externos
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportAllICS}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Exportar Alertas (.ics)</span>
          </button>
          <button
            onClick={() => { setDataEventoForm(selectedDateStr); setNovoEventoOpen(true); }}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#00796B] hover:bg-[#004D40] text-white font-bold rounded-xl shadow-sm transition-all text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid — 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 sm:p-6 shadow-xs space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
            <h2 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-[#00796B]" />
              <span>{MONTH_NAMES[month]} {year}</span>
            </h2>
            <div className="flex items-center space-x-1.5">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
              </button>
              <button onClick={() => { setCurrentDate(today); setSelectedDateStr(todayStr); }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-50 dark:bg-teal-950 text-[#00796B] dark:text-teal-300">
                Hoje
              </button>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800">
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400">
            <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /><span>Vencida</span></span>
            <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /><span>Vencendo</span></span>
            <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /><span>Evento</span></span>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-bold uppercase text-gray-400 dark:text-zinc-500">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`e-${i}`} className="h-12 sm:h-16" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayData = dateMap.get(dateStr);
              const lics = dayData?.licencas || [];
              const evs = dayData?.eventos || [];
              const isSelected = selectedDateStr === dateStr;
              const isToday = todayStr === dateStr;
              const hasExpired = lics.some((l) => getDaysUntilExpiry(l.dataVencimento) < 0);
              const hasSoon = lics.some((l) => { const d = getDaysUntilExpiry(l.dataVencimento); return d >= 0 && d <= 30; });

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-12 sm:h-16 p-1 rounded-xl border flex flex-col justify-between text-left transition-all ${
                    isSelected
                      ? 'border-[#00796B] bg-[#00796B]/10 dark:bg-[#00796B]/20 ring-2 ring-[#00796B]'
                      : isToday
                      ? 'border-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                      : 'border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <span className={`text-xs font-bold leading-none ${isToday ? 'text-[#00796B]' : 'text-gray-800 dark:text-zinc-200'}`}>
                    {dayNum}
                  </span>
                  <div className="flex items-center gap-0.5 flex-wrap">
                    {hasExpired && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                    {hasSoon && !hasExpired && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    {evs.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                    {(lics.length + evs.length) > 0 && (
                      <span className="text-[9px] font-extrabold text-gray-500 dark:text-zinc-400 ml-0.5">
                        {lics.length + evs.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel — Tabs: Dia selecionado | Alertas próximos */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xs flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('dia')}
              className={`flex-1 px-4 py-3 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === 'dia'
                  ? 'border-b-2 border-[#00796B] text-[#00796B] dark:text-teal-400'
                  : 'text-gray-400 hover:text-gray-700 dark:text-zinc-500'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Dia Selecionado</span>
            </button>
            <button
              onClick={() => setActiveTab('alertas')}
              className={`flex-1 px-4 py-3 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all relative ${
                activeTab === 'alertas'
                  ? 'border-b-2 border-rose-500 text-rose-600 dark:text-rose-400'
                  : 'text-gray-400 hover:text-gray-700 dark:text-zinc-500'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Alertas</span>
              {alertas.length > 0 && (
                <span className="absolute top-2 right-3 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {alertas.length > 9 ? '9+' : alertas.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* ---- TAB: DIA SELECIONADO ---- */}
            {activeTab === 'dia' && (
              <>
                <div className="flex items-center justify-between pb-2">
                  <p className="text-xs font-extrabold text-[#00796B] dark:text-teal-400">
                    {formatDate(selectedDateStr)}
                  </p>
                  <button
                    onClick={() => { setDataEventoForm(selectedDateStr); setNovoEventoOpen(true); }}
                    className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-[#00796B] dark:text-teal-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {selectedDayData.licencas.length === 0 && selectedDayData.eventos.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 dark:text-zinc-500">
                    <CalendarIcon className="w-9 h-9 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">Sem eventos nesta data.</p>
                  </div>
                ) : (
                  <>
                    {/* License expirations */}
                    {selectedDayData.licencas.map((lic) => {
                      const est = estMap.get(lic.estabelecimentoId);
                      const config = getTipoLicencaConfig(lic.tipoLicenca);
                      const days = getDaysUntilExpiry(lic.dataVencimento);
                      const expired = days < 0;

                      return (
                        <div key={lic._id} className={`p-3 rounded-xl border space-y-2 ${
                          expired
                            ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20'
                            : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20'
                        }`}>
                          <div className="flex items-start justify-between group cursor-pointer" onClick={() => navigate(`/licencas/${lic._id}`)}>
                            <div>
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                expired ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200' : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                              }`}>
                                {expired ? 'VENCIDA' : `Vence em ${days}d`}
                              </span>
                              <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-1 group-hover:text-[#00796B] dark:group-hover:text-teal-400 transition-colors">
                                {config.label} ({lic.codigo})
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">{est?.nome || '—'}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0 group-hover:text-[#00796B]" />
                          </div>

                          {/* Per-license calendar sync buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap border-t border-amber-100 dark:border-amber-900/30 pt-2">
                            <button onClick={() => syncGoogle(lic)}
                              className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center space-x-1 hover:bg-blue-100 transition-colors">
                              <CalendarPlus className="w-3 h-3" /><span>Google</span>
                            </button>
                            <button onClick={() => syncOutlook(lic)}
                              className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-[10px] font-bold flex items-center space-x-1 hover:bg-sky-100 transition-colors">
                              <CalendarPlus className="w-3 h-3" /><span>Outlook</span>
                            </button>
                            <button onClick={() => syncICS(lic)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center space-x-1 hover:bg-emerald-100 transition-colors">
                              <Download className="w-3 h-3" /><span>iCal</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Custom DB events */}
                    {selectedDayData.eventos.map((ev) => (
                      <div key={ev._id} className={`p-3 rounded-xl border transition-all flex items-start justify-between ${
                        ev.concluido
                          ? 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40 opacity-60'
                          : 'border-teal-200 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-950/20'
                      }`}>
                        <div className="flex items-start space-x-2">
                          <button onClick={() => handleToggle(ev._id)} className="mt-0.5 text-gray-400 hover:text-[#00796B]">
                            {ev.concluido
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              : <Clock className="w-5 h-5 text-teal-500" />}
                          </button>
                          <div>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-[#00796B] dark:text-teal-300">
                              {ev.tipo}
                            </span>
                            <h4 className={`font-bold text-sm mt-0.5 ${ev.concluido ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                              {ev.titulo}
                            </h4>
                            {ev.descricao && <p className="text-xs text-gray-500 dark:text-zinc-400">{ev.descricao}</p>}
                          </div>
                        </div>
                        <button onClick={() => handleRemove(ev._id)} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg ml-2">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {/* ---- TAB: ALERTAS PRÓXIMOS ---- */}
            {activeTab === 'alertas' && (
              <>
                <div className="pb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 dark:text-zinc-400">
                    {alertas.length} vencimento{alertas.length !== 1 ? 's' : ''} nos próximos 30 dias
                  </p>
                  {alertas.length > 0 && (
                    <button onClick={exportAllICS}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center space-x-1 hover:bg-indigo-100">
                      <Download className="w-3 h-3" /><span>Todos .ics</span>
                    </button>
                  )}
                </div>

                {alertas.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 dark:text-zinc-500">
                    <CheckCircle2 className="w-9 h-9 mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="text-xs font-medium">Tudo em dia nos próximos 30 dias!</p>
                  </div>
                ) : (
                  alertas.map((lic) => {
                    const est = estMap.get(lic.estabelecimentoId);
                    const config = getTipoLicencaConfig(lic.tipoLicenca);
                    const expired = lic.days < 0;

                    return (
                      <div key={lic._id} className={`p-3 rounded-xl border space-y-2 ${
                        expired
                          ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20'
                      }`}>
                        <div className="flex items-start justify-between group cursor-pointer" onClick={() => navigate(`/licencas/${lic._id}`)}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                                expired ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200' : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                              }`}>
                                {expired ? 'Vencida' : `${lic.days}d`}
                              </span>
                              <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate group-hover:text-[#00796B]">
                                {config.label} ({lic.codigo})
                              </h4>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{est?.nome || '—'}</p>
                            <p className="text-[11px] font-semibold text-gray-600 dark:text-zinc-300">{formatDate(lic.dataVencimento)}</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-1 flex-shrink-0 group-hover:text-[#00796B]" />
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap border-t border-amber-100 dark:border-amber-900/30 pt-2">
                          <button onClick={() => syncGoogle(lic)}
                            className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center space-x-1 hover:bg-blue-100 transition-colors">
                            <CalendarPlus className="w-3 h-3" /><span>Google</span>
                          </button>
                          <button onClick={() => syncOutlook(lic)}
                            className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-[10px] font-bold flex items-center space-x-1 hover:bg-sky-100 transition-colors">
                            <CalendarPlus className="w-3 h-3" /><span>Outlook</span>
                          </button>
                          <button onClick={() => syncICS(lic)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center space-x-1 hover:bg-emerald-100 transition-colors">
                            <Download className="w-3 h-3" /><span>iCal</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {novoEventoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#00796B] to-[#1565C0] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-6 h-6" />
                <h2 className="font-bold text-lg">Novo Compromisso</h2>
              </div>
              <button onClick={() => setNovoEventoOpen(false)} className="p-1 rounded-lg hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvento} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">Título *</label>
                <input
                  type="text"
                  placeholder="Vistoria Sanitária de Rotina"
                  value={tituloEvento}
                  onChange={(e) => setTituloEvento(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">Tipo *</label>
                  <select
                    value={tipoEvento}
                    onChange={(e) => setTipoEvento(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  >
                    <option value="vistoria">Vistoria / Inspeção</option>
                    <option value="renovacao">Renovação de Licença</option>
                    <option value="lembrete">Lembrete Técnico</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">Data *</label>
                  <input
                    type="date"
                    value={dataEventoForm}
                    onChange={(e) => setDataEventoForm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">Observações</label>
                <textarea
                  rows={3}
                  placeholder="Detalhes do compromisso..."
                  value={descricaoEvento}
                  onChange={(e) => setDescricaoEvento(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-gray-100 dark:border-zinc-800">
                <button type="button" onClick={() => setNovoEventoOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold text-sm">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-[#00796B] text-white font-bold rounded-xl text-sm hover:bg-[#004D40]">
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
