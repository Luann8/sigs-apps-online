import React, { useState } from 'react';
import { Building2, Bell, Menu, Plus, ChevronDown, LogOut, User } from 'lucide-react';
import { useEstabelecimentosStore } from '../../store/estabelecimentosStore';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function Header({ alertCount = 0, onOpenMobileMenu, onOpenEstablishmentPicker, onOpenCadastro }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const { estabelecimentoAtual } = useEstabelecimentosStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const selectedEst = estabelecimentos.find((e) => e._id === estabelecimentoAtual) || estabelecimentos[0];

  const handleLogout = () => {
    logout();
    toast.info('Sessão encerrada com sucesso.');
    navigate('/login');
  };

  return (
    /*
     * Header is h-16 and NOT sticky — it sits inside the right-column
     * flex container which already starts below the viewport top.
     * This means sidebar brand (also h-16) and header are always in the
     * same row, perfectly aligned, with no z-index fights.
     */
    <header className="h-16 flex-shrink-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between transition-colors">

      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Establishment picker */}
        <button
          onClick={onOpenEstablishmentPicker}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700/80 transition-colors"
        >
          <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-3.5 h-3.5 text-[#00796B] dark:text-teal-400" />
          </div>
          <div className="text-left max-w-[120px] sm:max-w-[200px] truncate">
            <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider leading-none">Unidade</p>
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight mt-0.5">
              {selectedEst ? selectedEst.nome : 'Todas'}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        </button>

        {/* Convex status pill — desktop only */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Convex Cloud
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Alerts bell */}
        <button
          onClick={() => navigate('/alertas')}
          className="relative p-2 rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          title="Alertas"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* Quick add — mobile only */}
        <button
          onClick={onOpenCadastro}
          className="md:hidden flex items-center gap-1 px-2.5 py-1.5 bg-[#00796B] text-white text-xs font-bold rounded-xl"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Nova</span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name || 'User'}
              className="w-7 h-7 rounded-lg object-cover border border-gray-200 dark:border-zinc-700"
            />
            <span className="hidden sm:block text-xs font-bold text-gray-800 dark:text-zinc-200">
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-gray-400" />
          </button>

          {userMenuOpen && (
            <>
              {/* click-away backdrop */}
              <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 py-2 z-40">
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-zinc-700">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-extrabold text-[#00796B] dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md">
                    {user?.role || 'Fiscal'}
                  </span>
                </div>

                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/configuracoes'); }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Perfil &amp; Opções
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair da Conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
