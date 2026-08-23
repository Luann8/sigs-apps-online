import React, { useState } from 'react';
import { X, Building2, Plus, Check, Phone, Mail, MapPin, User, ShieldCheck } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useEstabelecimentosStore } from '../../store/estabelecimentosStore';
import { formatCNPJ, maskTelefone } from '../../utils/formatters';
import { toast } from 'sonner';

export function EstablishmentPickerModal({ isOpen, onClose }) {
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const { estabelecimentoAtual, setEstabelecimentoAtual } = useEstabelecimentosStore();

  const addMutation = useMutation(api.estabelecimentos.add);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [crmv, setCrmv] = useState('');
  const [tipo, setTipo] = useState('veterinaria');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (id) => {
    setEstabelecimentoAtual(id);
    toast.success('Estabelecimento selecionado!');
    onClose();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !cnpj || !responsavel || !endereco) {
      toast.error('Preencha os campos obrigatórios (Nome, CNPJ, Responsável, Endereço).');
      return;
    }

    setIsSubmitting(true);
    try {
      const newId = await addMutation({
        nome,
        cnpj,
        responsavel,
        endereco,
        telefone: telefone || undefined,
        email: email || undefined,
        crmv: crmv || undefined,
        tipo,
        userId: 'default_user',
      });
      setEstabelecimentoAtual(newId);
      toast.success('Novo estabelecimento cadastrado e selecionado!');
      setIsFormOpen(false);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao cadastrar estabelecimento: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-zinc-800">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#00796B] to-[#1565C0] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6" />
            <h2 className="font-bold text-lg">
              {isFormOpen ? 'Novo Estabelecimento' : 'Selecionar Estabelecimento'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!isFormOpen ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  Escolha o estabelecimento para filtrar visualizações e relatórios:
                </p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/60 text-[#00796B] dark:text-teal-300 font-semibold text-xs rounded-xl hover:bg-teal-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo</span>
                </button>
              </div>

              {/* All Option */}
              <button
                onClick={() => handleSelect(null)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  estabelecimentoAtual === null
                    ? 'border-[#00796B] bg-[#00796B]/5 dark:bg-[#00796B]/20'
                    : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-300">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Todos os Estabelecimentos</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Visualização global consolidada</p>
                  </div>
                </div>
                {estabelecimentoAtual === null && <Check className="w-5 h-5 text-[#00796B]" />}
              </button>

              {/* List of Establishments */}
              <div className="space-y-2">
                {estabelecimentos.map((est) => {
                  const isSelected = estabelecimentoAtual === est._id;
                  return (
                    <button
                      key={est._id}
                      onClick={() => handleSelect(est._id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-[#00796B] bg-[#00796B]/5 dark:bg-[#00796B]/20 ring-1 ring-[#00796B]'
                          : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-[#00796B] dark:text-teal-400">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-gray-900 dark:text-white">{est.nome}</h3>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                est.tipo === 'sanitaria'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              }`}
                            >
                              {est.tipo}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            CNPJ: {formatCNPJ(est.cnpj)} • Resp: {est.responsavel}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-[#00796B]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Nome / Razão Social *
                  </label>
                  <input
                    type="text"
                    placeholder="Clínica Veterinária Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Responsável Técnico *
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. João Mendes"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Tipo de Estabelecimento
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  >
                    <option value="veterinaria">Veterinária / Pet</option>
                    <option value="sanitaria">Sanitária Geral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  placeholder="Av. Brasil, 1500 - Centro"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="contato@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Registro CRMV
                  </label>
                  <input
                    type="text"
                    placeholder="CRMV-SP 1234"
                    value={crmv}
                    onChange={(e) => setCrmv(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 font-medium text-gray-700 dark:text-zinc-300"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#00796B] text-white font-bold rounded-xl shadow hover:bg-[#004D40]"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
