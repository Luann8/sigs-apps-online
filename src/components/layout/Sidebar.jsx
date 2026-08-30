import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  Calendar,
  Bell,
  Settings,
  Plus,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { useSettingsStore } from '../../store/settingsStore';
import sigsLogo from '../../../assets/favicon.png';

export function Sidebar({ alertCount = 0, onOpenCadastro, compact = false }) {
  const { isDark } = useTheme();
  const setTheme   = useSettingsStore((s) => s.setTheme);

  const navItems = [
    { to: '/',                 label: 'Visão Geral',       icon: LayoutDashboard },
    { to: '/estabelecimentos', label: 'Estabelecimentos',  icon: Building2 },
    { to: '/licencas',         label: 'Licenças',          icon: FileCheck2, badge: null },
    { to: '/calendario',       label: 'Calendário',        icon: Calendar },
    { to: '/alertas',          label: 'Central de Alertas',icon: Bell,      badge: alertCount },
    { to: '/configuracoes',    label: 'Configurações',     icon: Settings },
  ];

  return (
    /*
     * Sidebar is a full-height flex column, exactly w-64.
     * It does NOT use h-screen or sticky — the parent (AppLayout)
     * is responsible for constraining height so this fills naturally.
     */
    <aside className="w-64 flex-shrink-0 h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col transition-colors">

      {/* Brand — same height as Header (h-16) so they align perfectly */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={sigsLogo}
            alt="SIGS"
            className="w-8 h-8 rounded-xl object-contain flex-shrink-0"
          />
          <div className="leading-none">
            <p className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">SIGS</p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium mt-0.5">Vigilância &amp; Licenças</p>
          </div>
        </div>

        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          title="Alternar Tema"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Nova Licença CTA */}
      {!compact && (
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={onOpenCadastro}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00796B] hover:bg-[#004D40] text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            Nova Licença
          </button>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#00796B]/10 text-[#00796B] dark:bg-[#00796B]/20 dark:text-[#4DB6AC] font-semibold'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
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

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 flex-shrink-0">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500">SIGS Web v1.0</p>
        <p className="text-[10px] text-gray-400 dark:text-zinc-500">Conectado via Convex Cloud</p>
      </div>
    </aside>
  );
}
