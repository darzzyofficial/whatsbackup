import React from 'react';
import { Smartphone, HardDrive, History, FileText, Settings, Shield, Lock, CheckCircle2, Menu, X, ShieldAlert, Sparkles, Moon, Sun } from 'lucide-react';
import { LinkedDevice } from '../types';

export type ActiveView = 'link' | 'backup' | 'history' | 'reports' | 'settings' | 'admin';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  linkedDevice: LinkedDevice;
  backupHistoryCount: number;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeAdminCode: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  linkedDevice,
  backupHistoryCount,
  mobileMenuOpen,
  onToggleMobileMenu,
  darkMode,
  onToggleDarkMode,
  activeAdminCode,
}) => {
  const navItems = [
    {
      id: 'link' as ActiveView,
      label: 'Link Device',
      icon: <Smartphone className="w-5 h-5 shrink-0" />,
      badge: linkedDevice.isLinked ? (
        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Connected</span>
        </span>
      ) : (
        <span className="text-[10px] text-slate-400">Unlinked</span>
      ),
    },
    {
      id: 'backup' as ActiveView,
      label: 'Create Backup',
      icon: linkedDevice.isLinked ? (
        <HardDrive className="w-5 h-5 shrink-0" />
      ) : (
        <Lock className="w-5 h-5 shrink-0 text-amber-500" />
      ),
      badge: !linkedDevice.isLinked ? (
        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-sm font-semibold">
          Locked
        </span>
      ) : (
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
          Ready
        </span>
      ),
    },
    {
      id: 'history' as ActiveView,
      label: 'Backup History',
      icon: <History className="w-5 h-5 shrink-0" />,
      badge: (
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 tabular-nums">
          {backupHistoryCount}
        </span>
      ),
    },
    {
      id: 'reports' as ActiveView,
      label: 'Sample Reports',
      icon: <FileText className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      id: 'settings' as ActiveView,
      label: 'Settings',
      icon: <Settings className="w-5 h-5 shrink-0" />,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#075E54] text-white sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleMobileMenu}
            className="p-1 rounded-md text-emerald-100 hover:text-white hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#25D366] text-[#075E54] flex items-center justify-center font-bold text-sm shadow-xs">
              WB
            </div>
            <span className="font-bold text-sm tracking-tight">WhatsBackup</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              onSelectView('admin');
              if (mobileMenuOpen) onToggleMobileMenu();
            }}
            className="px-2 py-1 rounded-md bg-white/15 text-white text-[11px] font-semibold"
          >
            Admin
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div
          onClick={onToggleMobileMenu}
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-xs"
        />
      )}

      {/* Desktop & Mobile Slide-Out Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#f0f2f5] dark:bg-[#111b21] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand & Profile */}
        <div>
          {/* Brand Header */}
          <div className="p-4 bg-[#075E54] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#25D366] text-[#075E54] flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-white/20">
                WB
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">WhatsBackup</h1>
                <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-semibold">
                  Demo Simulation
                </p>
              </div>
            </div>

            <button
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* User Profile Bar (WhatsApp Web style) */}
          <div className="px-4 py-3 bg-[#e9edef] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#075E54] text-[#25D366] flex items-center justify-center font-bold text-xs ring-2 ring-[#25D366]/40">
                AC
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  Alex Carter
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {linkedDevice.isLinked ? linkedDevice.deviceName : 'No device linked'}
                </div>
              </div>
            </div>

            {linkedDevice.isLinked ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Device connected" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" title="Device disconnected" />
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    if (mobileMenuOpen) onToggleMobileMenu();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#25D366]/15 text-[#075E54] dark:text-[#25D366] font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#202c33]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-[#075E54] dark:text-[#25D366]' : 'text-slate-500 dark:text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Admin Quick Switcher & Compliance */}
        <div className="p-3 space-y-2 border-t border-slate-200 dark:border-slate-800 bg-[#e9edef] dark:bg-[#182229]">
          {/* Admin Panel Button */}
          <button
            onClick={() => {
              onSelectView('admin');
              if (mobileMenuOpen) onToggleMobileMenu();
            }}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
              activeView === 'admin'
                ? 'bg-[#075E54] text-white border-[#075E54] shadow-xs'
                : 'bg-white dark:bg-[#111b21] border-slate-300 dark:border-slate-700 hover:border-[#075E54] text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${activeView === 'admin' ? 'text-[#25D366]' : 'text-[#075E54] dark:text-[#25D366]'}`} />
              <span className="font-semibold">Admin Panel</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Code: {activeAdminCode.slice(0, 4)}..
            </span>
          </button>

          {/* Compliance notice */}
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#111b21] text-[10px] text-slate-500 dark:text-slate-400 leading-tight flex items-start gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Independent demo simulation. Does not connect to WhatsApp.
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
