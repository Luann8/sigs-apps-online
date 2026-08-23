import React, { useState, useMemo } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { getDaysUntilExpiry } from '../../utils/formatters';
import { CadastroModal } from '../modals/CadastroModal';
import { EstablishmentPickerModal } from '../modals/EstablishmentPickerModal';
import { LayoutDashboard, Building2, FileCheck2, Calendar, Bell, Settings, X, Plus } from 'lucide-react';
import { Toaster } from 'sonner';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [estPickerOpen, setEstPickerOpen] = useState(false);

  const rawLicencas = useQuery(api.licencas.listAll) ?? [];

  const alertCount = useMemo(() => {
    return rawLicencas.filter((l) => {
      const d = getDaysUntilExpiry(l.dataVencimento);
      return d <= 7 || l.status === 'vencida';
    }).length;
  }, [rawLicencas]);

  const mobileNavItems = [
    { to: '/', label: 'Início', icon: LayoutDashboard },
    { to: '/calendario', label: 'Calendário', icon: Calendar },
    { to: '/licencas', label: 'Licenças', icon: FileCheck2, badge: alertCount },
    { to: '/configuracoes', label: 'Opções', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 overflow-hidden">
      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar alertCount={alertCount} onOpenCadastro={() => setCadastroOpen(true)} />
      </div>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-white dark:bg-zinc-900 h-full flex flex-col z-10 shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
              <span className="font-extrabold text-lg text-[#00796B]">SIGS Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                alertCount={alertCount}
                onOpenCadastro={() => {
                  setMobileMenuOpen(false);
                  setCadastroOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          alertCount={alertCount}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenEstablishmentPicker={() => setEstPickerOpen(true)}
          onOpenCadastro={() => setCadastroOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-around px-2 z-30 shadow-lg">
          {mobileNavItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-14 py-1 text-xs font-medium ${
                    isActive ? 'text-[#00796B] dark:text-[#4DB6AC]' : 'text-gray-500 dark:text-zinc-400'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </NavLink>
            );
          })}

          {/* Floating Action Button in Middle */}
          <button
            onClick={() => setCadastroOpen(true)}
            className="-mt-6 w-12 h-12 rounded-full bg-[#00796B] hover:bg-[#004D40] text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900"
          >
            <Plus className="w-6 h-6" />
          </button>

          {mobileNavItems.slice(2).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center w-14 py-1 text-xs font-medium ${
                    isActive ? 'text-[#00796B] dark:text-[#4DB6AC]' : 'text-gray-500 dark:text-zinc-400'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute top-0 right-2 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Modals */}
      {cadastroOpen && <CadastroModal isOpen={cadastroOpen} onClose={() => setCadastroOpen(false)} />}
      {estPickerOpen && (
        <EstablishmentPickerModal isOpen={estPickerOpen} onClose={() => setEstPickerOpen(false)} />
      )}
    </div>
  );
}
