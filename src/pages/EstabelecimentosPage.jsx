import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { formatCNPJ, maskTelefone } from '../utils/formatters';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Edit,
  Phone,
  Mail,
  MapPin,
  User,
  ShieldCheck,
} from 'lucide-react';
import { EstablishmentPickerModal } from '../components/modals/EstablishmentPickerModal';
import { toast } from 'sonner';

export function EstabelecimentosPage() {
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const removeMutation = useMutation(api.estabelecimentos.remove);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = estabelecimentos.filter((e) => {
    const query = search.toLowerCase();
    return (
      (e.nome || '').toLowerCase().includes(query) ||
      (e.cnpj || '').toLowerCase().includes(query) ||
      (e.responsavel || '').toLowerCase().includes(query)
    );
  });

  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja remover o estabelecimento "${nome}"?`)) return;
    try {
      await removeMutation({ id });
      toast.success('Estabelecimento removido!');
    } catch (err) {
      toast.error('Erro ao remover: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Gestão de Estabelecimentos
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Empresas, clínicas veterinárias e unidades sanitárias cadastradas
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#00796B] hover:bg-[#004D40] text-white font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Cadastrar Estabelecimento</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por Razão Social, CNPJ ou Responsável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none shadow-xs"
        />
      </div>

      {/* Grid of Establishments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((est) => (
          <div
            key={est._id}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 text-[#00796B] dark:text-teal-400 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <span
                  className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                    est.tipo === 'sanitaria'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  }`}
                >
                  {est.tipo}
                </span>
              </div>

              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white mt-3 leading-snug">
                {est.nome}
              </h3>
              <p className="text-xs font-semibold text-[#00796B] dark:text-teal-400">
                CNPJ: {formatCNPJ(est.cnpj)}
              </p>

              <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-zinc-400 border-t border-gray-100 dark:border-zinc-800 pt-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Resp. Técnico: <strong className="text-gray-800 dark:text-zinc-200">{est.responsavel}</strong></span>
                </div>
                {est.crmv && (
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>CRMV: <strong>{est.crmv}</strong></span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{est.endereco}</span>
                </div>
                {est.telefone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{maskTelefone(est.telefone)}</span>
                  </div>
                )}
                {est.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{est.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => handleDelete(est._id, est.nome)}
                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && <EstablishmentPickerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
