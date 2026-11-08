import React, { useState } from 'react';
import { Settings, Moon, Sun, Smartphone, RotateCcw, Trash2, Info, ShieldCheck, Check } from 'lucide-react';
import { LinkedDevice } from '../types';

interface SettingsViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  linkedDevice: LinkedDevice;
  onDisconnectDevice: () => void;
  onResetDemo: () => void;
  onClearHistory: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  onToggleDarkMode,
  linkedDevice,
  onDisconnectDevice,
  onResetDemo,
  onClearHistory,
}) => {
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [historyClearedSuccess, setHistoryClearedSuccess] = useState<boolean>(false);

  const handleReset = () => {
    if (window.confirm('Reset all demo state (linking status, active codes, and backup history) to defaults?')) {
      onResetDemo();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all demo backup history archives?')) {
      onClearHistory();
      setHistoryClearedSuccess(true);
      setTimeout(() => setHistoryClearedSuccess(false), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Disclaimer */}
      <div className="mb-6 p-4 rounded-xl bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#075E54] dark:text-[#25D366] shrink-0" />
        <span>
          WhatsBackup is an independent demonstration platform. It does not connect to WhatsApp or access real user accounts or personal data.
        </span>
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#075e54] text-white flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#25D366]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize appearance, manage virtual connections, and manage demo storage
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8 divide-y divide-slate-100 dark:divide-slate-800">
          
          {/* 1. Theme Configuration */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {darkMode ? <Moon className="w-4 h-4 text-[#25D366]" /> : <Sun className="w-4 h-4 text-amber-500" />}
              Appearance & Theme
            </h2>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  {darkMode ? 'WhatsApp Dark Mode' : 'Clean Light Mode'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between WhatsApp Web light theme and dark green/slate palette.
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleDarkMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  darkMode ? 'bg-[#25D366]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 2. Device Link Status */}
          <div className="pt-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
              Virtual Device Connection
            </h2>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {linkedDevice.deviceName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        linkedDevice.isLinked
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {linkedDevice.isLinked ? 'Connected' : 'Unlinked'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Virtual Profile: {linkedDevice.phoneDisplay} · Platform: {linkedDevice.devicePlatform}
                  </p>
                </div>

                {linkedDevice.isLinked && (
                  <button
                    onClick={onDisconnectDevice}
                    className="px-3.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
                  >
                    Disconnect Device
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Demo Reset & Storage */}
          <div className="pt-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
              Demo Data & Storage Controls
            </h2>

            {resetSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Demo environment reset to factory defaults!</span>
              </div>
            )}

            {historyClearedSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Backup history cleared!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Clear Backup Archives</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Purge all simulated backup records from current browser session.
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleClearHistory}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Clear History</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Reset Demo to Default</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Re-locks device, restores default code (G5KPWFAA), and seeds initial records.
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleReset}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Everything</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Application Information */}
          <div className="pt-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
              About WhatsBackup
            </h2>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span>Application Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">WhatsBackup</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span>Architecture:</span>
                <span className="text-slate-900 dark:text-white">Fictional Backup Simulation Engine</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span>Design System:</span>
                <span className="text-slate-900 dark:text-white">WhatsApp Web UI Aesthetics</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Demo Linking Mode:</span>
                <span className="text-slate-900 dark:text-white">Phone Number Code Protocol (No QR)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>Mandatory Compliance Notice:</strong> WhatsBackup is an independent demonstration platform. It does not connect to WhatsApp or access real user accounts or personal data. All linking codes, conversation messages, contact listings, and media items are completely simulated.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
