import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Download,
  ExternalLink,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Bell,
  Building2,
  FileText,
  Check,
} from 'lucide-react';
import {
  generateGoogleCalendarUrl,
  generateOutlookWebUrl,
  generateOffice365Url,
  generateYahooCalendarUrl,
  downloadICSFile,
} from '../../utils/calendarExport';
import { getTipoLicencaConfig, formatDate, formatCNPJ } from '../../utils/formatters';
import { toast } from 'sonner';

export function CalendarSyncModal({ isOpen, onClose, licenca = null, licencas = [], estabelecimentos = [] }) {
  const [step, setStep] = useState(1); // Step 1: Escolher Calendário, Step 2: Confirmar Dados, Step 3: Concluído
  const [selectedProvider, setSelectedProvider] = useState('google'); // 'google', 'outlook', 'office365', 'ical', 'yahoo'
  const [selectedLicencaId, setSelectedLicencaId] = useState(licenca?._id || (licencas[0]?._id || ''));
  const [diasAntecedencia, setDiasAntecedencia] = useState(7);
  const [customTitle, setCustomTitle] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  const estMap = new Map();
  estabelecimentos.forEach((e) => estMap.set(e._id, e));

  const currentLicenca = licenca || licencas.find((l) => l._id === selectedLicencaId) || licencas[0];

  useEffect(() => {
    if (currentLicenca) {
      const cfg = getTipoLicencaConfig(currentLicenca.tipoLicenca);
      const est = estMap.get(currentLicenca.estabelecimentoId);
      setCustomTitle(`${cfg.label} (${currentLicenca.codigo})`);
      setCustomNotes(
        `Estabelecimento: ${est?.nome || 'N/A'}\nCNPJ: ${formatCNPJ(est?.cnpj) || 'N/A'}\nResponsável: ${est?.responsavel || 'N/A'}\nData de Emissão: ${formatDate(currentLicenca.dataEmissao)}\nData de Vencimento: ${formatDate(currentLicenca.dataVencimento)}`
      );
    }
  }, [currentLicenca, selectedLicencaId]);

  if (!isOpen) return null;

  const providers = [
    {
      id: 'google',
      name: 'Google Calendar',
      desc: 'Sincronizar diretamente com sua conta do Google Agenda',
      icon: 'G',
      color: 'bg-blue-600 text-white border-blue-200 dark:border-blue-900',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
    },
    {
      id: 'outlook',
      name: 'Outlook.com (Pessoal)',
      desc: 'Para contas Microsoft pessoais (@outlook.com, @hotmail.com)',
      icon: 'O',
      color: 'bg-sky-600 text-white border-sky-200 dark:border-sky-900',
      badgeBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
    },
    {
      id: 'office365',
      name: 'Office 365 / Corporativo',
      desc: 'Para contas empresariais e corporativas da Microsoft',
      icon: '365',
      color: 'bg-orange-600 text-white border-orange-200 dark:border-orange-900',
      badgeBg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300',
    },
    {
      id: 'ical',
      name: 'Apple / iCal (.ics)',
      desc: 'Download de evento com alarme sonoro para iPhone, Mac e Outlook Desktop',
      icon: 'iCal',
      color: 'bg-emerald-600 text-white border-emerald-200 dark:border-emerald-900',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'yahoo',
      name: 'Yahoo Calendar',
      desc: 'Adicionar à agenda do Yahoo',
      icon: 'Y!',
      color: 'bg-purple-600 text-white border-purple-200 dark:border-purple-900',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
    },
  ];

  const handleExecuteSync = () => {
    if (!currentLicenca) {
      toast.error('Nenhuma licença selecionada.');
      return;
    }

    const est = estMap.get(currentLicenca.estabelecimentoId);
    const payload = {
      title: customTitle,
      description: `${customNotes}\n\n[Lembrete SIGS: Notificar ${diasAntecedencia} dias antes]`,
      dateStr: currentLicenca.dataVencimento,
      location: est?.endereco || '',
    };

    if (selectedProvider === 'google') {
      const url = generateGoogleCalendarUrl(payload);
      window.open(url, '_blank');
      toast.success('Redirecionando para o Google Calendar com todos os dados preenchidos!');
    } else if (selectedProvider === 'outlook') {
      const url = generateOutlookWebUrl(payload);
      window.open(url, '_blank');
      toast.success('Redirecionando para o Outlook.com!');
    } else if (selectedProvider === 'office365') {
      const url = generateOffice365Url(payload);
      window.open(url, '_blank');
      toast.success('Redirecionando para o Office 365 Corporativo!');
    } else if (selectedProvider === 'yahoo') {
      const url = generateYahooCalendarUrl(payload);
      window.open(url, '_blank');
      toast.success('Redirecionando para o Yahoo Calendar!');
    } else if (selectedProvider === 'ical') {
      downloadICSFile([payload], `vencimento-${currentLicenca.codigo}.ics`);
      toast.success('Arquivo de calendário (.ics) baixado com lembrete configurado!');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-zinc-800">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#00796B] via-[#1565C0] to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-tight">Sincronizar com Agenda</h2>
              <p className="text-xs text-teal-100 font-medium">
                Passo {step} de 2: {step === 1 ? 'Escolher Calendário' : 'Preencher Dados do Evento'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-zinc-800 h-1.5">
          <div
            className="bg-[#00796B] h-1.5 transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* PASSO 1: Escolher o Calendário */}
          {step === 1 && (
            <div className="space-y-4">
              {!licenca && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Selecione a Licença:
                  </label>
                  <select
                    value={selectedLicencaId}
                    onChange={(e) => setSelectedLicencaId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  >
                    {licencas.map((l) => {
                      const cfg = getTipoLicencaConfig(l.tipoLicenca);
                      return (
                        <option key={l._id} value={l._id}>
                          {cfg.label} ({l.codigo}) - Vence em {formatDate(l.dataVencimento)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                1. Escolha o seu serviço de calendário:
              </p>

              <div className="space-y-2.5">
                {providers.map((p) => {
                  const isSelected = selectedProvider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProvider(p.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-[#00796B] bg-[#00796B]/5 dark:bg-[#00796B]/20 ring-2 ring-[#00796B]'
                          : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${p.color}`}>
                          {p.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">{p.desc}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-[#00796B]" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-end border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-[#00796B] hover:bg-[#004D40] text-white font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all"
                >
                  <span>Próximo: Dados do Evento</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASSO 2: Preencher & Confirmar Dados Necessários */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                2. Confirme os dados que serão adicionados ao calendário:
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Data do Vencimento
                  </label>
                  <div className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/80 text-gray-900 dark:text-white font-bold text-xs">
                    {formatDate(currentLicenca?.dataVencimento)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Alarme / Lembrete Prévio *
                  </label>
                  <select
                    value={diasAntecedencia}
                    onChange={(e) => setDiasAntecedencia(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  >
                    <option value={0}>No dia do vencimento</option>
                    <option value={1}>1 dia antes</option>
                    <option value={7}>7 dias antes (Recomendado)</option>
                    <option value={15}>15 dias antes</option>
                    <option value={30}>30 dias antes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Descrição & Detalhes do Estabelecimento
                </label>
                <textarea
                  rows={4}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center space-x-1.5 text-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteSync}
                  className="px-6 py-2.5 bg-[#00796B] hover:bg-[#004D40] text-white font-bold rounded-xl shadow-md flex items-center space-x-2 text-xs transition-all transform hover:scale-[1.02]"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Adicionar ao Calendário Agora</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
