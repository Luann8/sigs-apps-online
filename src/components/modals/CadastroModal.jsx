import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, HardDrive, Link, ExternalLink } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useEstabelecimentosStore } from '../../store/estabelecimentosStore';
import { TIPOS_LICENCA, generateCodigo } from '../../utils/formatters';
import { toast } from 'sonner';

export function CadastroModal({ isOpen, onClose, editLicenca = null }) {
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const licencas = useQuery(api.licencas.listAll) ?? [];
  const { estabelecimentoAtual } = useEstabelecimentosStore();

  const addLicencaMutation = useMutation(api.licencas.add);
  const updateLicencaMutation = useMutation(api.licencas.update);

  const [estabelecimentoId, setEstabelecimentoId] = useState('');
  const [tipoLicenca, setTipoLicenca] = useState(TIPOS_LICENCA[0].key);
  const [situacao, setSituacao] = useState('em_dia');
  const [protocoloRenovacao, setProtocoloRenovacao] = useState('');
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().slice(0, 10));
  const [dataVencimento, setDataVencimento] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [custo, setCusto] = useState('');
  const [anexoUri, setAnexoUri] = useState('');
  const [anexoTipo, setAnexoTipo] = useState('url'); // 'url' | 'drive'
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editLicenca) {
      setEstabelecimentoId(editLicenca.estabelecimentoId);
      setTipoLicenca(editLicenca.tipoLicenca);
      // Resolve a situação: usa campo novo ou mapeia o legado
      const legadoMap = { ativa: 'em_dia', pendente: 'a_vencer', vencida: 'vencida', suspensa: 'suspensa' };
      setSituacao(editLicenca.situacao ?? legadoMap[editLicenca.status] ?? 'em_dia');
      setProtocoloRenovacao(editLicenca.protocoloRenovacao || '');
      setDataEmissao(editLicenca.dataEmissao || new Date().toISOString().slice(0, 10));
      setDataVencimento(editLicenca.dataVencimento || '');
      setCusto(editLicenca.custo ? String(editLicenca.custo) : '');
      setAnexoUri(editLicenca.anexoUri || '');
      setAnexoTipo(editLicenca.anexoUri?.includes('drive.google.com') ? 'drive' : 'url');
    } else {
      const defaultEst = estabelecimentoAtual || (estabelecimentos[0] ? estabelecimentos[0]._id : '');
      setEstabelecimentoId(defaultEst);
    }
  }, [editLicenca, estabelecimentos, estabelecimentoAtual]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!estabelecimentoId) {
      toast.error('Selecione um estabelecimento.');
      return;
    }
    if (!dataVencimento) {
      toast.error('Informe a data de vencimento.');
      return;
    }

    // Validate URL if provided
    if (anexoUri && !anexoUri.startsWith('http')) {
      toast.error('O link do anexo deve começar com http:// ou https://');
      return;
    }

    setIsSubmitting(true);
    try {
      // Mantém status legado sincronizado com a nova situação para retrocompatibilidade
      const statusLegado = { em_dia: 'ativa', a_vencer: 'pendente', renovacao_protocolada: 'ativa',
                             vencida: 'vencida', nunca_obtido: 'vencida', suspensa: 'suspensa' }[situacao] ?? 'ativa';
      if (editLicenca) {
        await updateLicencaMutation({
          id: editLicenca._id,
          tipoLicenca,
          status: statusLegado,
          situacao,
          protocoloRenovacao: protocoloRenovacao || undefined,
          dataEmissao,
          dataVencimento,
          anexoUri: anexoUri || undefined,
          custo: custo ? parseFloat(custo) : undefined,
        });
        toast.success('Licença atualizada com sucesso!');
      } else {
        const nextCodigo = generateCodigo(licencas.length + 1);
        await addLicencaMutation({
          estabelecimentoId,
          codigo: nextCodigo,
          tipoLicenca,
          status: statusLegado,
          situacao,
          protocoloRenovacao: protocoloRenovacao || undefined,
          dataEmissao,
          dataVencimento,
          anexoUri: anexoUri || undefined,
          custo: custo ? parseFloat(custo) : undefined,
        });
        toast.success(`Licença ${nextCodigo} cadastrada com sucesso!`);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar licença: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-zinc-800">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#00796B] to-[#1565C0] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6" />
            <h2 className="font-bold text-lg">{editLicenca ? 'Editar Licença' : 'Cadastrar Nova Licença'}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Estabelecimento Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
              Estabelecimento *
            </label>
            <select
              value={estabelecimentoId}
              onChange={(e) => setEstabelecimentoId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
              required
              disabled={!!editLicenca}
            >
              <option value="" disabled>Selecione o estabelecimento...</option>
              {estabelecimentos.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.nome} — CNPJ: {e.cnpj}
                </option>
              ))}
            </select>
            {estabelecimentos.length === 0 && (
              <p className="text-xs text-rose-500 mt-1">Nenhum estabelecimento cadastrado. Cadastre um primeiro.</p>
            )}
          </div>

          {/* Tipo de Licença */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
              Tipo de Documento / Licença *
            </label>
            <select
              value={tipoLicenca}
              onChange={(e) => setTipoLicenca(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
            >
              {TIPOS_LICENCA.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Situação do documento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                Situação do Documento *
              </label>
              <select
                value={situacao}
                onChange={(e) => { setSituacao(e.target.value); if (e.target.value !== 'renovacao_protocolada') setProtocoloRenovacao(''); }}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
              >
                <option value="em_dia">Em dia</option>
                <option value="a_vencer">A vencer (&le;30 dias)</option>
                <option value="renovacao_protocolada">Renovação protocolada</option>
                <option value="vencida">Vencida</option>
                <option value="nunca_obtido">Nunca obtido</option>
                <option value="suspensa">Suspensa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                Custo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
              />
            </div>
          </div>

          {/* Número do protocolo de renovação (condicional) */}
          {situacao === 'renovacao_protocolada' && (
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                Nº do Protocolo de Renovação *
              </label>
              <input
                type="text"
                placeholder="Ex: SEI-RJ 2024/00123456"
                value={protocoloRenovacao}
                onChange={(e) => setProtocoloRenovacao(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Esse protocolo comprova a renovação tempestiva. O documento fica amarelo (atenção) em vez de vermelho.
              </p>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                Data de Emissão
              </label>
              <input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Anexar Documento via Link */}
          <div className="space-y-2 border-t border-gray-100 dark:border-zinc-800 pt-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
              Documento Digital (Link de Nuvem) — Opcional
            </label>

            <div className="flex items-center space-x-2 text-xs">
              <button
                type="button"
                onClick={() => { setAnexoTipo('url'); setAnexoUri(''); }}
                className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1 transition-colors ${
                  anexoTipo === 'url'
                    ? 'border-[#00796B] bg-teal-50 dark:bg-teal-950/60 text-[#00796B] dark:text-teal-400'
                    : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>Link Direto</span>
              </button>

              <button
                type="button"
                onClick={() => { setAnexoTipo('drive'); setAnexoUri('https://drive.google.com/file/d/'); }}
                className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1 transition-colors ${
                  anexoTipo === 'drive'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Google Drive</span>
              </button>
            </div>

            <input
              type="text"
              placeholder={
                anexoTipo === 'drive'
                  ? 'https://drive.google.com/file/d/SEU_ID/view'
                  : 'https://exemplo.com/documento.pdf'
              }
              value={anexoUri}
              onChange={(e) => setAnexoUri(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
            />

            {anexoUri && (
              <div className="flex items-center space-x-2 text-xs text-teal-700 dark:text-teal-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Anexo definido</span>
                <a href={anexoUri} target="_blank" rel="noreferrer" className="hover:underline flex items-center space-x-0.5">
                  <ExternalLink className="w-3 h-3" />
                  <span>Testar link</span>
                </a>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || estabelecimentos.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[#00796B] hover:bg-[#004D40] text-white font-bold shadow-md transition-all disabled:opacity-50 flex items-center space-x-2 text-sm"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? 'Salvando...' : editLicenca ? 'Salvar Alterações' : 'Criar Licença'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
