import React, { useState, useMemo } from 'react';
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
  Users,
  ShieldCheck,
} from 'lucide-react';
import { EstablishmentPickerModal } from '../components/modals/EstablishmentPickerModal';
import { VinculoModal } from '../components/modals/VinculoModal';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { filterEstabelecimentosForUser, canAccessAll } from '../utils/userAccess';

export function EstabelecimentosPage() {
  const { user } = useAuthStore();
  const liveUser = useQuery(api.usuarios.getByEmail, user?.email ? { email: user.email } : "skip");
  const rawEstabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const removeMutation = useMutation(api.estabelecimentos.remove);

  const isAdmin = canAccessAll(liveUser || user);
  const estabelecimentos = useMemo(() => {
    return filterEstabelecimentosForUser(rawEstabelecimentos, user, liveUser);
  }, [rawEstabelecimentos, user, liveUser]);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [vinculoOpen, setVinculoOpen] = useState(false);
  const [vinculoTarget, setVinculoTarget] = useState(null);

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
                  className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${est.tipo === 'sanitaria'
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

            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              {isAdmin ? (
                <button
                  onClick={() => {
                    setVinculoTarget(est);
                    setVinculoOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                  title="Vincular usuários a este estabelecimento"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Usuários ({est.usuariosIds?.length || 0})</span>
                </button>
              ) : (
                <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                  {est.usuariosIds?.length || 0} usuário(s) vinculado(s)
                </span>
              )}

              {isAdmin && (
                <button
                  onClick={() => handleDelete(est._id, est.nome)}
                  className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-8">
          <Building2 className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 dark:text-zinc-200 text-base">Nenhum estabelecimento encontrado</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 max-w-md mx-auto">
            {estabelecimentos.length === 0
              ? 'Sua conta ainda não possui estabelecimentos vinculados. Aguarde um administrador associar sua conta a uma clínica.'
              : 'Tente ajustar os termos da sua busca.'}
          </p>
        </div>
      )}

      {modalOpen && <EstablishmentPickerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}

      {vinculoOpen && vinculoTarget && (
        <VinculoModal
          isOpen={vinculoOpen}
          onClose={() => {
            setVinculoOpen(false);
            setVinculoTarget(null);
          }}
          modo="estabelecimento"
          target={vinculoTarget}
        />
      )}
    </div>
  );
}
