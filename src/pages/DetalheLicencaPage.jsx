import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  getTipoLicencaConfig,
  formatDate,
  getDaysUntilExpiry,
  formatCNPJ,
} from '../utils/formatters';
import {
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  ClipboardCheck,
  Plus,
  ExternalLink,
  Printer,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  CalendarPlus,
} from 'lucide-react';
import { InspecaoModal } from '../components/modals/InspecaoModal';
import { CalendarSyncModal } from '../components/modals/CalendarSyncModal';
import { toast } from 'sonner';

export function DetalheLicencaPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const licencas = useQuery(api.licencas.listAll) ?? [];
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const inspecoes = useQuery(api.inspecoes.listByLicenca, id ? { licencaId: id } : 'skip') ?? [];
  const removeInspecaoMutation = useMutation(api.inspecoes.remove);

  const [inspecaoModalOpen, setInspecaoModalOpen] = useState(false);
  const [calendarSyncOpen, setCalendarSyncOpen] = useState(false);

  const licenca = licencas.find((l) => l._id === id);
  const estabelecimento = estabelecimentos.find((e) => e._id === licenca?.estabelecimentoId);

  if (!licenca) {
    return (
      <div className="py-12 text-center text-gray-500 space-y-4">
        <p className="font-semibold text-lg">Licença não encontrada.</p>
        <button
          onClick={() => navigate('/licencas')}
          className="px-4 py-2 bg-[#00796B] text-white rounded-xl font-bold"
        >
          Voltar para Licenças
        </button>
      </div>
    );
  }

  const config = getTipoLicencaConfig(licenca.tipoLicenca);
  const days = getDaysUntilExpiry(licenca.dataVencimento);
  const isExpired = days < 0;
  const isSoon = days <= 30 && days >= 0;

  const isGoogleDrive = licenca.anexoUri && licenca.anexoUri.includes('drive.google.com');

  const handleDeleteInspecao = async (inspId) => {
    if (!window.confirm('Remover este registro de inspeção?')) return;
    try {
      await removeInspecaoMutation({ id: inspId });
      toast.success('Inspeção removida.');
    } catch (err) {
      toast.error('Erro ao remover inspeção.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/licencas')}
        className="flex items-center space-x-2 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:text-[#00796B] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para lista</span>
      </button>

      {/* Main License Detail Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950 text-[#00796B] dark:text-teal-400 flex items-center justify-center font-extrabold text-xl shadow-xs">
              {licenca.codigo}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                  {config.label}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isExpired
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : isSoon
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {isExpired ? 'Vencida' : isSoon ? `Vence em ${days}d` : 'Ativa'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                {estabelecimento ? `${estabelecimento.nome} • CNPJ: ${formatCNPJ(estabelecimento.cnpj)}` : 'Sem estabelecimento'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {licenca.anexoUri && (
              <a
                href={licenca.anexoUri}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center space-x-2 px-4 py-2 font-semibold rounded-xl text-sm transition-colors ${
                  isGoogleDrive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100'
                    : 'bg-teal-50 text-[#00796B] dark:bg-teal-950 dark:text-teal-300 hover:bg-teal-100'
                }`}
              >
                {isGoogleDrive ? <HardDrive className="w-4 h-4 text-blue-600" /> : <ExternalLink className="w-4 h-4" />}
                <span>{isGoogleDrive ? 'Abrir no Google Drive' : 'Visualizar Anexo'}</span>
              </a>
            )}

            <button
              onClick={() => setCalendarSyncOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold rounded-xl text-sm hover:bg-indigo-100 transition-colors"
            >
              <CalendarPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Sincronizar Agenda</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Data de Emissão</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {formatDate(licenca.dataEmissao)}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Data de Vencimento</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {formatDate(licenca.dataVencimento)}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Custo Declarado</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {licenca.custo ? `R$ ${licenca.custo.toFixed(2)}` : 'Isento / Não informado'}
            </p>
          </div>
        </div>
      </div>

      {/* Inspections History Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-[#00796B]" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">
              Histórico de Vistorias e Inspeções ({inspecoes.length})
            </h2>
          </div>

          <button
            onClick={() => setInspecaoModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#00796B] hover:bg-[#004D40] text-white text-xs font-bold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Inspeção</span>
          </button>
        </div>

        {inspecoes.length === 0 ? (
          <div className="py-8 text-center text-gray-400 dark:text-zinc-500 text-sm">
            Nenhuma vistoria ou inspeção registrada para esta licença.
          </div>
        ) : (
          <div className="space-y-3">
            {inspecoes.map((insp) => (
              <div
                key={insp._id}
                className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 flex items-start justify-between"
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {insp.resultado === 'aprovado' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : insp.resultado === 'reprovado' ? (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        Inspeção em {formatDate(insp.data)}
                      </h4>
                      <span className="text-xs font-bold capitalize px-2 py-0.5 rounded-md bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200">
                        {insp.resultado}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                      Fiscal: <strong>{insp.fiscal}</strong>
                    </p>
                    {insp.observacoes && (
                      <p className="text-xs text-gray-700 dark:text-zinc-300 mt-2 bg-white dark:bg-zinc-800 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-700">
                        {insp.observacoes}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteInspecao(insp._id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                  title="Excluir Inspeção"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {inspecaoModalOpen && (
        <InspecaoModal
          isOpen={inspecaoModalOpen}
          onClose={() => setInspecaoModalOpen(false)}
          licencaId={id}
        />
      )}

      {calendarSyncOpen && (
        <CalendarSyncModal
          isOpen={calendarSyncOpen}
          onClose={() => setCalendarSyncOpen(false)}
          licenca={licenca}
          licencas={licencas}
          estabelecimentos={estabelecimentos}
        />
      )}
    </div>
  );
}
