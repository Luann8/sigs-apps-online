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
  ShieldAlert,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { useSettingsStore } from '../../store/settingsStore';

export function Sidebar({ alertCount = 0, onOpenCadastro }) {
  const { isDark } = useTheme();
  const setTheme = useSettingsStore((s) => s.setTheme);

  const navItems = [
    { to: '/', label: 'Visão Geral', icon: LayoutDashboard },
    { to: '/estabelecimentos', label: 'Estabelecimentos', icon: Building2 },
    { to: '/licencas', label: 'Licenças', icon: FileCheck2, badge: null },
    { to: '/calendario', label: 'Calendário', icon: Calendar },
    { to: '/alertas', label: 'Central de Alertas', icon: Bell, badge: alertCount },
    { to: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col h-screen sticky top-0 z-30 transition-colors">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00796B] to-[#1565C0] flex items-center justify-center shadow-md text-white">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-gray-900 dark:text-white leading-none tracking-tight">SIGS</h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Vigilância & Licenças</p>
          </div>
        </div>

        {/* Quick Theme Switch */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          title="Alternar Tema"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Action Button */}
      <div className="p-4">
        <button
          onClick={onOpenCadastro}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#00796B] hover:bg-[#004D40] text-white font-semibold rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Licença</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-[#00796B]/10 text-[#00796B] dark:bg-[#00796B]/20 dark:text-[#4DB6AC] font-semibold'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full animate-pulse">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-100 dark:border-zinc-800 text-xs text-gray-400 dark:text-zinc-500">
        <p className="font-semibold text-gray-500 dark:text-zinc-400">SIGS Web v1.0</p>
        <p>Sistema Conectado via Convex</p>
      </div>
    </aside>
  );
}
