import React, { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { getDaysUntilExpiry } from '../../utils/formatters';
import { calcularRisco } from '../../utils/licencaRisco';
import { CadastroModal } from '../modals/CadastroModal';
import { EstablishmentPickerModal } from '../modals/EstablishmentPickerModal';
import {
  LayoutDashboard, Building2, FileCheck2, Calendar,
  Bell, Settings, X, Plus, Menu,
  ChevronDown, LogOut, User, Moon, Sun, Building,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useEstabelecimentosStore } from '../../store/estabelecimentosStore';
import { useTheme } from '../../theme/ThemeContext';
import { useSettingsStore } from '../../store/settingsStore';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import sigsLogo from '../../../assets/favicon.png';

// ─── Mobile Drawer — contém tudo que estava no header + sidebar ────────────
function MobileDrawer({ open, onClose, alertCount, onOpenCadastro, onOpenEstPicker }) {
  const navigate       = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark }     = useTheme();
  const setTheme       = useSettingsStore((s) => s.setTheme);
  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const { estabelecimentoAtual } = useEstabelecimentosStore();
  const selectedEst = estabelecimentos.find((e) => e._id === estabelecimentoAtual) || estabelecimentos[0];

  const navItems = [
    { to: '/',                 label: 'Visão Geral',        icon: LayoutDashboard },
    { to: '/estabelecimentos', label: 'Estabelecimentos',   icon: Building2 },
    { to: '/licencas',         label: 'Licenças',           icon: FileCheck2 },
    { to: '/calendario',       label: 'Calendário',         icon: Calendar },
    { to: '/alertas',          label: 'Central de Alertas', icon: Bell, badge: alertCount },
    { to: '/configuracoes',    label: 'Configurações',      icon: Settings },
  ];

  const handleNav = (to) => { onClose(); navigate(to); };
  const handleLogout = () => {
    onClose();
    logout();
    toast.info('Sessão encerrada.');
    navigate('/login');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* drawer panel */}
      <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-zinc-900 flex flex-col z-10 shadow-2xl">

        {/* ── Drawer header (brand + close) ── */}
        <div className="flex items-center justify-between px-5 pt-12 pb-5">
          <div className="flex items-center gap-3">
          <img src={sigsLogo} alt="SIGS" className="w-9 h-9 rounded-xl object-contain" />
          <div>
            <p className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight leading-none">SIGS</p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">Vigilância &amp; Licenças</p>
          </div>
        </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── User card ── */}
        <div className="mx-4 mb-4 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center gap-3">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user?.name}
            className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-zinc-700"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">{user?.email}</p>
            <span className="inline-block mt-0.5 text-[9px] font-extrabold text-[#00796B] dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-1.5 py-0.5 rounded">
              {user?.role || 'Fiscal'}
            </span>
          </div>
        </div>

        {/* ── Establishment picker ── */}
        <button
          onClick={() => { onClose(); onOpenEstPicker(); }}
          className="mx-4 mb-4 flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center flex-shrink-0">
            <Building className="w-4 h-4 text-[#00796B] dark:text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Unidade ativa</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {selectedEst ? selectedEst.nome : 'Todas as unidades'}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        {/* ── Nova licença CTA ── */}
        <div className="mx-4 mb-4">
          <button
            onClick={() => { onClose(); onOpenCadastro(); }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#00796B] hover:bg-[#004D40] text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Licença
          </button>
        </div>

        {/* ── Nav links ── */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 px-3 pb-2">Navegação</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#00796B]/10 text-[#00796B] dark:bg-[#00796B]/20 dark:text-[#4DB6AC] font-semibold'
                      : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Footer actions ── */}
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 space-y-1">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? 'Tema claro' : 'Tema escuro'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AppLayout ──────────────────────────────────────────────────────────────
export function AppLayout() {
  const { user } = useAuthStore();
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [cadastroOpen,  setCadastroOpen]  = useState(false);
  const [estPickerOpen, setEstPickerOpen] = useState(false);

  const rawLicencas = useQuery(api.licencas.listAll) ?? [];

  const alertCount = useMemo(() => {
    return rawLicencas.filter((l) => {
      const r = calcularRisco(l);
      return r.cor === 'vermelho' || r.cor === 'laranja';
    }).length;
  }, [rawLicencas]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Toaster position="top-right" richColors />

      {/* ── Desktop sidebar (unchanged) ─────────────────────────────── */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar alertCount={alertCount} onOpenCadastro={() => setCadastroOpen(true)} />
      </div>

      {/* ── Mobile unified drawer ────────────────────────────────────── */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        alertCount={alertCount}
        onOpenCadastro={() => setCadastroOpen(true)}
        onOpenEstPicker={() => setEstPickerOpen(true)}
      />

      {/* ── Right column ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Desktop header */}
        <div className="hidden md:block">
          <Header
            alertCount={alertCount}
            onOpenMobileMenu={() => setDrawerOpen(true)}
            onOpenEstablishmentPicker={() => setEstPickerOpen(true)}
            onOpenCadastro={() => setCadastroOpen(true)}
          />
        </div>

        {/* Mobile top strip — minimal: just hamburger + logo + bell */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <img src={sigsLogo} alt="SIGS" className="w-6 h-6 rounded-lg object-contain" />
            <span className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">SIGS</span>
          </div>

          <div className="flex items-center gap-1">
            {alertCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                {alertCount > 9 ? '9+' : alertCount} alertas
              </span>
            )}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.name}
                className="w-7 h-7 rounded-lg object-cover border border-gray-200 dark:border-zinc-700"
              />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modals */}
      {cadastroOpen  && <CadastroModal isOpen={cadastroOpen} onClose={() => setCadastroOpen(false)} />}
      {estPickerOpen && <EstablishmentPickerModal isOpen={estPickerOpen} onClose={() => setEstPickerOpen(false)} />}
    </div>
  );
}
