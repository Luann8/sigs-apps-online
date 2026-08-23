import React, { useState } from 'react';
import { Building2, Bell, Menu, Plus, ChevronDown, LogOut, User, Shield } from 'lucide-react';
import { useEstabelecimentosStore } from '../../store/estabelecimentosStore';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function Header({ alertCount = 0, onOpenMobileMenu, onOpenEstablishmentPicker, onOpenCadastro }) {
  const navigate = useNavigate();
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const { estabelecimentoAtual, setEstabelecimentoAtual } = useEstabelecimentosStore();
  const { user, logout } = useAuthStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const selectedEst = estabelecimentos.find((e) => e._id === estabelecimentoAtual) || estabelecimentos[0];

  const handleLogout = () => {
    logout();
    toast.info('Sessão encerrada com sucesso.');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left: Mobile Toggle & Establishment Selector */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Establishment Picker Button */}
        <div className="relative">
          <button
            onClick={onOpenEstablishmentPicker}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700/80 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-[#00796B] dark:bg-teal-950 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="max-w-[110px] xs:max-w-[160px] sm:max-w-[220px] truncate">
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">Unidade Ativa</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                {selectedEst ? selectedEst.nome : 'Todas as Unidades'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 ml-0.5 flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Right: Notifications, Quick Add & User Avatar Menu */}
      <div className="flex items-center space-x-1.5 sm:space-x-3">
        <button
          onClick={() => navigate('/alertas')}
          className="relative p-2 rounded-xl text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          title="Alertas"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenCadastro}
          className="md:hidden flex items-center space-x-1 px-2.5 py-1.5 bg-[#00796B] text-white text-xs font-bold rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Nova</span>
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-xl object-cover border border-gray-200 dark:border-zinc-700"
            />
            <span className="hidden sm:inline-block text-xs font-bold text-gray-800 dark:text-zinc-200">
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown className="hidden sm:inline-block w-3.5 h-3.5 text-gray-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 py-2 z-40 space-y-1">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-700">
                <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-extrabold text-[#00796B] dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md">
                  {user?.role || 'Fiscal'}
                </span>
              </div>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/configuracoes');
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
              >
                <User className="w-4 h-4 text-gray-400" />
                <span>Perfil & Opções</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
