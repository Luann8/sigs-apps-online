import React, { useState } from 'react';
import { X, ClipboardCheck, CheckCircle } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

export function InspecaoModal({ isOpen, onClose, licencaId }) {
  const addInspecaoMutation = useMutation(api.inspecoes.add);

  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [resultado, setResultado] = useState('aprovado');
  const [fiscal, setFiscal] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !licencaId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fiscal) {
      toast.error('Informe o nome do fiscal / responsável.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addInspecaoMutation({
        licencaId,
        data,
        resultado,
        fiscal,
        observacoes: observacoes || undefined,
      });
      toast.success('Inspeção registrada com sucesso!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar inspeção: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-gray-100 dark:border-zinc-800">
        <div className="px-6 py-4 bg-gradient-to-r from-[#00796B] to-[#1565C0] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="w-6 h-6" />
            <h2 className="font-bold text-lg">Registrar Nova Inspeção</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
              Data da Inspeção *
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
              Resultado da Vistoria *
            </label>
            <select
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#00796B] focus:outline-none"
            >
              <option value="aprovado">Aprovado / Regular</option>
              <option value="pendente">Pendente / Adequações</option>
              <option value="reprovado">Reprovado / Irregular</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
              Fiscal / Responsável Técnico *
            </label>
            <input
              type="text"
              placeholder="Dr. Fernando Alves (Fiscal Sanitário)"
              value={fiscal}
              onChange={(e) => setFiscal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
              Observações / Parecer Técnico
            </label>
            <textarea
              rows={3}
              placeholder="Instalações verificadas em conformidade com as exigências sanitárias..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 font-medium text-gray-700 dark:text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#00796B] text-white font-bold rounded-xl shadow hover:bg-[#004D40]"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Inspeção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
