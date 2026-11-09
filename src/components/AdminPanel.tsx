import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Check,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  History,
  Radio,
  Lock,
  Eye,
  EyeOff,
  User,
  LogOut,
  Database,
  Wifi,
  WifiOff,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AdminConfig, LinkedDevice, BackupRecord, RealtimeSyncStatus } from '../types';
import {
  updateRemoteDeviceConnection,
  SUPABASE_TABLE_SETUP_SQL,
  loginAdminRemote,
  logoutAdminRemote,
  getCurrentAdminUser,
  updateAdminPasswordRemote,
} from '../services/supabaseClient';

interface AdminPanelProps {
  adminConfig: AdminConfig;
  onUpdateAdminConfig: (newConfig: AdminConfig) => void;
  linkedDevice: LinkedDevice;
  onDisconnectDevice: () => void;
  backupHistory: BackupRecord[];
  syncStatus?: RealtimeSyncStatus;
  onBackToUserView: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  adminConfig,
  onUpdateAdminConfig,
  linkedDevice,
  onDisconnectDevice,
  backupHistory,
  syncStatus,
  onBackToUserView,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>(adminConfig.adminEmail || '');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Configuration form state
  const [codeInput, setCodeInput] = useState<string>(adminConfig.linkingCode);
  const [isActive, setIsActive] = useState<boolean>(adminConfig.isActive);
  const [allowConnection, setAllowConnection] = useState<boolean>(adminConfig.allowConnection || false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Supabase Realtime synchronization state
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>(
    adminConfig.supabaseUrl || (import.meta.env.VITE_SUPABASE_URL || '')
  );
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>(
    adminConfig.supabaseAnonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  );
  const [isSavingRealtime, setIsSavingRealtime] = useState<boolean>(false);
  const [supabaseSaveSuccess, setSupabaseSaveSuccess] = useState<boolean>(false);
  const [showSqlScript, setShowSqlScript] = useState<boolean>(false);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);

  // Password update state
  const [newPassword, setNewPassword] = useState<string>('');
  const [credSaveSuccess, setCredSaveSuccess] = useState<boolean>(false);
  const [credSaveError, setCredSaveError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // Check for existing active session on mount
  useEffect(() => {
    let isMounted = true;
    getCurrentAdminUser(adminConfig.supabaseUrl, adminConfig.supabaseAnonKey).then((res) => {
      if (isMounted && res.isAuthenticated) {
        setIsAuthenticated(true);
        if (res.email) setLoginEmail(res.email);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [adminConfig.supabaseUrl, adminConfig.supabaseAnonKey]);

  // Prevent background sync from overwriting active user typing
  const isEditingCodeRef = React.useRef(false);
  const lastSavedCodeRef = React.useRef(adminConfig.linkingCode);

  // Sync internal state with external adminConfig changes without interrupting user typing
  useEffect(() => {
    if (!isEditingCodeRef.current && adminConfig.linkingCode !== lastSavedCodeRef.current) {
      setCodeInput(adminConfig.linkingCode);
      lastSavedCodeRef.current = adminConfig.linkingCode;
    }
  }, [adminConfig.linkingCode]);

  useEffect(() => {
    setIsActive(adminConfig.isActive);
  }, [adminConfig.isActive]);

  useEffect(() => {
    setAllowConnection(adminConfig.allowConnection || false);
  }, [adminConfig.allowConnection]);

  useEffect(() => {
    if (adminConfig.adminEmail) setLoginEmail(adminConfig.adminEmail);
  }, [adminConfig.adminEmail]);

  // Handle Login submission via real Supabase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const inputEmail = loginEmail.trim();
    const inputPass = loginPassword.trim();

    if (!inputEmail || !inputPass) {
      setLoginError('Please enter both your admin email and password.');
      setIsLoggingIn(false);
      return;
    }

    try {
      const res = await loginAdminRemote(inputEmail, inputPass, {
        customUrl: adminConfig.supabaseUrl,
        customAnonKey: adminConfig.supabaseAnonKey,
      });

      if (res.success) {
        setIsAuthenticated(true);
        setLoginError(null);
        onUpdateAdminConfig({
          ...adminConfig,
          adminEmail: inputEmail,
          updatedAt: new Date().toISOString(),
        });
      } else {
        setLoginError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutAdminRemote({
      customUrl: adminConfig.supabaseUrl,
      customAnonKey: adminConfig.supabaseAnonKey,
    });
    setIsAuthenticated(false);
    setLoginPassword('');
    onBackToUserView();
  };

  // Handle immediate Realtime Toggle of Allow Device Connection with database confirmation
  const handleToggleAllowConnection = async (newValue: boolean) => {
    setValidationError(null);
    setIsSavingRealtime(true);

    try {
      const res = await updateRemoteDeviceConnection(newValue, {
        linkingCode: codeInput,
        isActive,
        adminEmail: loginEmail || adminConfig.adminEmail,
        customUrl: adminConfig.supabaseUrl,
        customAnonKey: adminConfig.supabaseAnonKey,
      });

      if (!res.success) {
        setValidationError(res.error || 'Failed to update device connection in database.');
        return;
      }

      setAllowConnection(newValue);
      const updated: AdminConfig = {
        ...adminConfig,
        allowConnection: newValue,
        linkingCode: codeInput,
        isActive,
        updatedAt: new Date().toISOString(),
      };
      onUpdateAdminConfig(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setValidationError(msg);
    } finally {
      setIsSavingRealtime(false);
    }
  };

  // Handle Save Configuration with database confirmation
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSaveSuccess(false);

    const sanitized = codeInput.replace(/[-\s]/g, '').toUpperCase();

    if (!sanitized) {
      setValidationError('Linking code cannot be blank.');
      return;
    }

    if (sanitized.length !== 8) {
      setValidationError('Linking code must be exactly 8 alphanumeric characters (e.g., G5KPWFAA).');
      return;
    }

    setIsSavingRealtime(true);
    try {
      const res = await updateRemoteDeviceConnection(allowConnection, {
        linkingCode: sanitized,
        isActive,
        adminEmail: loginEmail || adminConfig.adminEmail,
        customUrl: adminConfig.supabaseUrl,
        customAnonKey: adminConfig.supabaseAnonKey,
      });

      if (!res.success) {
        setValidationError(res.error || 'Failed to save configuration to Supabase.');
        return;
      }

      const updated: AdminConfig = {
        ...adminConfig,
        linkingCode: sanitized,
        isActive,
        allowConnection,
        updatedAt: new Date().toISOString(),
      };

      lastSavedCodeRef.current = sanitized;
      isEditingCodeRef.current = false;
      onUpdateAdminConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setValidationError(msg);
    } finally {
      setIsSavingRealtime(false);
    }
  };

  // Handle Save Supabase Credentials
  const handleSaveSupabaseCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AdminConfig = {
      ...adminConfig,
      supabaseUrl: supabaseUrlInput.trim(),
      supabaseAnonKey: supabaseKeyInput.trim(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateAdminConfig(updated);
    setSupabaseSaveSuccess(true);
    setTimeout(() => setSupabaseSaveSuccess(false), 2500);
  };

  // Copy Supabase SQL Setup script
  const handleCopySqlScript = () => {
    navigator.clipboard.writeText(SUPABASE_TABLE_SETUP_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Handle Admin Password Update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredSaveError(null);
    setCredSaveSuccess(false);

    if (!newPassword.trim()) {
      setCredSaveError('Please enter a new password.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setCredSaveError('Password must be at least 6 characters.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await updateAdminPasswordRemote(newPassword.trim(), {
        customUrl: adminConfig.supabaseUrl,
        customAnonKey: adminConfig.supabaseAnonKey,
      });

      if (res.success) {
        setCredSaveSuccess(true);
        setNewPassword('');
        setTimeout(() => setCredSaveSuccess(false), 2500);
      } else {
        setCredSaveError(res.error || 'Failed to update password.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Reset linking code to default
  const handleResetToDefault = async () => {
    isEditingCodeRef.current = false;
    setCodeInput('G5KPWFAA');
    setIsActive(true);
    setValidationError(null);

    setIsSavingRealtime(true);
    try {
      const res = await updateRemoteDeviceConnection(false, {
        linkingCode: 'G5KPWFAA',
        isActive: true,
        adminEmail: loginEmail || adminConfig.adminEmail,
        customUrl: adminConfig.supabaseUrl,
        customAnonKey: adminConfig.supabaseAnonKey,
      });

      if (res.success) {
        lastSavedCodeRef.current = 'G5KPWFAA';
        setAllowConnection(false);
        const updated: AdminConfig = {
          ...adminConfig,
          linkingCode: 'G5KPWFAA',
          isActive: true,
          allowConnection: false,
          updatedAt: new Date().toISOString(),
        };
        onUpdateAdminConfig(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        setValidationError(res.error || 'Failed to reset settings in database.');
      }
    } finally {
      setIsSavingRealtime(false);
    }
  };

  // Generate random 8-character demo code suggestion
  const handleGenerateRandomCode = () => {
    isEditingCodeRef.current = true;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCodeInput(result);
  };

  // 1. IF NOT LOGGED IN: DISPLAY AUTHENTICATION GATE
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-4 sm:px-6 py-5 sm:py-6 bg-[#075E54] text-white text-center relative">
            <button
              onClick={onBackToUserView}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 text-[#25D366] mx-auto flex items-center justify-center mb-2.5 sm:mb-3 shadow-inner">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold">Admin Authorization</h2>
            <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5 sm:mt-1">
              Authenticate via Supabase to access backend management
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 bg-white dark:bg-[#111b21]">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setLoginError(null);
                  }}
                  placeholder="admin@example.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="email"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#202c33] text-base sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setLoginError(null);
                  }}
                  placeholder="••••••••"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="current-password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#202c33] text-base sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex-1 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#02906f] disabled:opacity-75 text-white text-sm font-semibold shadow-md transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
              >
                {isLoggingIn && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{isLoggingIn ? 'Signing in...' : 'Sign In'}</span>
              </button>
              <button
                type="button"
                onClick={onBackToUserView}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">
                Log in with the verified admin email created in your Supabase Auth dashboard.
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. IF AUTHENTICATED: DISPLAY ADMIN CONTROL CENTER
  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      
      {/* Back button & Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <button
          onClick={onBackToUserView}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#075E54] dark:text-[#25D366] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to User Panel</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            Logged in: <strong className="font-mono">{loginEmail || adminConfig.adminEmail || 'admin'}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors cursor-pointer"
            title="Log Out of Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Main Admin Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 bg-[#075E54] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 text-[#25D366] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold">Admin Control Center</h1>
              <p className="text-[11px] sm:text-xs text-emerald-100 leading-tight">
                Manage demo linking authorization codes, device permissions, and simulation telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 ${
              adminConfig.isActive
                ? 'bg-emerald-500/20 text-white border border-emerald-400/40'
                : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
            }`}>
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Service: {adminConfig.isActive ? 'Active' : 'Deactivated'}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Stat Badges */}
        <div className="p-3 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#182229]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="p-2.5 sm:p-3.5 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Active Linking Code</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono tracking-wider">
                {adminConfig.linkingCode}
              </span>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Service Status</span>
              <span className={`text-sm font-bold ${adminConfig.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {adminConfig.isActive ? 'Operational' : 'Disabled (Offline)'}
              </span>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Virtual Devices Linked</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {linkedDevice.isLinked ? '1 Connected' : '0 Devices'}
              </span>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Total Demo Archives</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {backupHistory.length}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          
          {/* SECTION 1: SET / CHANGE LINKING CODE */}
          <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                  Linking Code Configuration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  The administrator manually enters the 8-character demo linking code delivered to users upon clicking "Generate Code".
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs text-[#075E54] dark:text-[#25D366] hover:underline font-medium shrink-0 cursor-pointer"
              >
                Reset to Default (G5KPWFAA)
              </button>
            </div>

            {/* Code Input & Status Toggle */}
            <div className="p-3.5 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 8-character input */}
                <div>
                  <label htmlFor="admin-code-field" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Demo Linking Code (8 Characters Alphanumeric):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="admin-code-field"
                      type="text"
                      maxLength={8}
                      value={codeInput}
                      onFocus={() => {
                        isEditingCodeRef.current = true;
                      }}
                      onBlur={() => {
                        isEditingCodeRef.current = false;
                      }}
                      onChange={(e) => {
                        isEditingCodeRef.current = true;
                        setCodeInput(e.target.value.toUpperCase());
                        setValidationError(null);
                      }}
                      placeholder="e.g. G5KPWFAA"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21] font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white uppercase focus:outline-hidden focus:border-[#25D366]"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRandomCode}
                      className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
                      title="Generate new random 8-char code"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Format displayed to user: <strong>{codeInput.slice(0, 4) || '????'} - {codeInput.slice(4, 8) || '????'}</strong>
                  </span>
                </div>

                {/* Service Activation Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Code Service Availability:
                  </label>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21]">
                    <div>
                      <span className="text-xs font-medium text-slate-900 dark:text-white block">
                        {isActive ? 'Code Active & Available' : 'Code Deactivated'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isActive ? 'Users can generate and verify this code' : 'Displays "Linking service currently unavailable"'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isActive ? 'bg-[#25D366]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Allow WhatsApp Connection Toggle */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Allow Device Connection (User "Connect WhatsApp" button):
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21]">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${allowConnection ? 'bg-[#25D366] animate-pulse' : 'bg-amber-500'}`} />
                        <span>{allowConnection ? 'Connection Allowed (User button enabled)' : 'Connection Blocked / Pending (User button disabled)'}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {allowConnection
                          ? 'The user can now click "Connect WhatsApp" to link device.'
                          : 'The "Connect WhatsApp" button remains unclickable until you allow it here.'}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isSavingRealtime}
                      onClick={() => handleToggleAllowConnection(!allowConnection)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        allowConnection ? 'bg-[#00a884]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          allowConnection ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Validation error */}
              {validationError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Save Success Notice */}
              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Configuration saved successfully to Supabase! Changes are live across all devices.</span>
                </div>
              )}

              {/* Save & Reset buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingRealtime}
                  className="px-5 py-2.5 rounded-xl bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-75 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isSavingRealtime ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>
          </form>

          {/* SECTION: ADMIN PASSWORD UPDATE */}
          <form onSubmit={handleSavePassword} className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                Admin Password Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your Supabase administrator password directly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="max-w-md">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Admin Password:
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21] text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              {credSaveError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{credSaveError}</span>
                </div>
              )}

              {credSaveSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Password updated successfully in Supabase Auth!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-4 py-2 rounded-xl bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-75 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdatingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>

          {/* SECTION: SUPABASE REALTIME CONFIGURATION */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                  <span>Supabase Realtime Cloud Synchronization</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Synchronizes "Allow Device Connection" across all active browsers and devices in real-time without refreshing.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                {syncStatus === 'connected' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                    <span className="text-emerald-700 dark:text-emerald-300">Realtime Active</span>
                  </>
                ) : syncStatus === 'connecting' ? (
                  <>
                    <Wifi className="w-3 h-3 text-amber-500 animate-spin" />
                    <span className="text-amber-600 dark:text-amber-400">Connecting...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-500">Offline / Local Mode</span>
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveSupabaseCredentials} className="p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Project URL:
                  </label>
                  <input
                    type="url"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21] text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Found in Supabase Project Settings &rarr; API &rarr; Project URL
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Anon / Publishable API Key:
                  </label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="sb_publishable_... or eyJhbGciOi..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21] text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Accepts sb_publishable_... or legacy anon key. Never enter service_role secret key.
                  </span>
                </div>
              </div>

              {supabaseSaveSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Supabase credentials saved! Connecting to realtime publication...</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Supabase Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSqlScript(!showSqlScript)}
                  className="text-xs text-[#075E54] dark:text-[#25D366] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>{showSqlScript ? 'Hide SQL Migration Setup' : 'View SQL Migration Setup Script'}</span>
                  {showSqlScript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* SQL Migration Script Box */}
              {showSqlScript && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] text-slate-400 font-sans">
                      Paste into Supabase SQL Editor (SQL Editor &rarr; New Query &rarr; Run):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySqlScript}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-sans flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {sqlCopied ? <Check className="w-3 h-3 text-[#25D366]" /> : <Copy className="w-3 h-3" />}
                      <span>{sqlCopied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-300/90 whitespace-pre">
                    {SUPABASE_TABLE_SETUP_SQL}
                  </pre>
                </div>
              )}
            </form>
          </div>

          {/* SECTION 2: DEVICE LINK CONTROL */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                Virtual Device Session Controls
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect currently connected demo devices or simulate administrative session revocation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800">
              {linkedDevice.isLinked ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {linkedDevice.deviceName}
                      </h4>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                        Connected
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-x-2">
                      {linkedDevice.phoneDisplay && (
                        <>
                          <span>Number: {linkedDevice.phoneDisplay}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>Platform: {linkedDevice.devicePlatform}</span>
                      <span>·</span>
                      <span>Linked: {linkedDevice.linkedAt || 'Active Session'}</span>
                    </div>
                  </div>

                  <button
                    onClick={onDisconnectDevice}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shrink-0"
                  >
                    Force Disconnect Device
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>No devices are currently connected. The User Panel's "Create Backup" feature is locked.</span>
                  <span className="text-slate-400 font-mono text-[11px]">Status: Idle</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: SYSTEM AUDIT LOG PREVIEW */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                Simulated Administrative Audit Log
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time tracking of code generations, verification handshakes, and archive completions.
              </p>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-[#182229] rounded-xl font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>[CONFIG] Admin active linking code initialized to {adminConfig.linkingCode}</span>
                <span className="text-slate-400">STATUS: OK</span>
              </div>
              <div className="flex items-center justify-between">
                <span>[AUTH] Device handshake verification engine: READY</span>
                <span className="text-emerald-600 dark:text-emerald-400">ONLINE</span>
              </div>
              {linkedDevice.isLinked && (
                <div className="flex items-center justify-between text-[#075E54] dark:text-[#25D366]">
                  <span>[CONNECT] Device {linkedDevice.deviceName} linked successfully at {linkedDevice.linkedAt}</span>
                  <span>AUTHENTICATED</span>
                </div>
              )}
              {backupHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-slate-500">
                  <span>[ARCHIVE] Backup {h.id} processed ({h.totalSizeFormatted})</span>
                  <span>COMPLETED</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Authoritative data managed via Supabase Cloud Realtime</span>
          <button
            onClick={onBackToUserView}
            className="px-4 py-2 rounded-lg bg-[#075E54] hover:bg-[#128C7E] text-white font-medium text-xs transition-colors"
          >
            Switch to User Mode
          </button>
        </div>
      </div>
    </div>
  );
};
