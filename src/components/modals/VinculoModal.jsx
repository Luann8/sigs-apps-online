import React, { useState, useEffect } from 'react';
import { X, Building2, User, Check, Search, ShieldCheck } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

/**
 * Modal universal para vincular Usuários a Clínicas ou Clínicas a Usuários.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - modo: 'usuario' (selecionar clínicas para um usuário) | 'estabelecimento' (selecionar usuários para uma clínica)
 * - target: objeto do usuário ou estabelecimento selecionado
 */
export function VinculoModal({ isOpen, onClose, modo = 'usuario', target }) {
  if (!isOpen || !target) return null;

  const todosUsuarios = useQuery(api.usuarios.listAll) ?? [];
  const todosEstabelecimentos = useQuery(api.estabelecimentos.list) ?? [];

  const setEstabelecimentosMutation = useMutation(api.usuarios.setEstabelecimentos);
  const setUsuariosMutation = useMutation(api.estabelecimentos.setUsuarios);

  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (modo === 'usuario') {
      // Clínicas que o usuário já tem vínculo
      const estIds = target.estabelecimentosIds || [];
      // Também verifica se alguma clínica já tem o id desse usuário
      const userIdStr = String(target._id || target.id);
      const vinculadosPelaClinica = todosEstabelecimentos
        .filter((e) => Array.isArray(e.usuariosIds) && e.usuariosIds.includes(userIdStr))
        .map((e) => e._id);
      const combined = Array.from(new Set([...estIds, ...vinculadosPelaClinica]));
      setSelectedIds(combined);
    } else {
      // Usuários que a clínica já tem vínculo
      const uIds = target.usuariosIds || [];
      const estIdStr = String(target._id);
      const vinculadosPeloUsuario = todosUsuarios
        .filter((u) => Array.isArray(u.estabelecimentosIds) && u.estabelecimentosIds.includes(estIdStr))
        .map((u) => u._id);
      const combined = Array.from(new Set([...uIds, ...vinculadosPeloUsuario]));
      setSelectedIds(combined);
    }
  }, [modo, target, todosEstabelecimentos, todosUsuarios]);

  const toggleItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modo === 'usuario') {
        await setEstabelecimentosMutation({
          usuarioId: target._id || target.id,
          estabelecimentosIds: selectedIds,
        });
        toast.success(`Vínculo de clínicas atualizado para "${target.nome || target.name}"!`);
      } else {
        await setUsuariosMutation({
          estabelecimentoId: target._id,
          usuariosIds: selectedIds,
        });
        toast.success(`Usuários vinculados a "${target.nome}" com sucesso!`);
      }
      onClose();
    } catch (err) {
      toast.error('Erro ao salvar vínculos: ' + (err.message || 'Erro inesperado'));
    } finally {
      setSaving(false);
    }
  };

  const items = modo === 'usuario' ? todosEstabelecimentos : todosUsuarios;
  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const name = (item.nome || item.name || '').toLowerCase();
    const docOrEmail = (item.cnpj || item.email || '').toLowerCase();
    return name.includes(q) || docOrEmail.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#00796B] to-[#1565C0] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {modo === 'usuario' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
            <div>
              <h2 className="font-bold text-base">
                {modo === 'usuario' ? 'Vincular Clínicas ao Usuário' : 'Vincular Usuários à Clínica'}
              </h2>
              <p className="text-xs text-teal-100 truncate max-w-[280px]">
                {target.nome || target.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={modo === 'usuario' ? 'Buscar clínica por nome ou CNPJ...' : 'Buscar usuário por nome ou e-mail...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00796B] focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {filteredItems.length === 0 ? (
            <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-8">
              Nenhum item encontrado.
            </p>
          ) : (
            filteredItems.map((item) => {
              const itemId = item._id;
              const isSelected = selectedIds.includes(itemId);
              const title = item.nome || item.name;
              const subtitle = item.cnpj ? `CNPJ: ${item.cnpj}` : item.email;

              return (
                <div
                  key={itemId}
                  onClick={() => toggleItem(itemId)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#00796B] bg-[#00796B]/5 dark:bg-[#00796B]/20 ring-1 ring-[#00796B]'
                      : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#00796B] text-white'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                      }`}
                    >
                      {modo === 'usuario' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-[#00796B] border-[#00796B] text-white'
                        : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-800/40">
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            <strong>{selectedIds.length}</strong> {modo === 'usuario' ? 'clínica(s)' : 'usuário(s)'} selecionado(s)
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 bg-[#00796B] hover:bg-[#004D40] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <span>{saving ? 'Salvando...' : 'Salvar Vínculos'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

