import React, { useState } from 'react';
import { Smartphone, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw, KeyRound, Copy, Check } from 'lucide-react';
import { AdminConfig, LinkedDevice } from '../types';

interface LinkDeviceViewProps {
  adminConfig: AdminConfig;
  linkedDevice: LinkedDevice;
  onDeviceLinked: (deviceData: Partial<LinkedDevice>) => void;
  onNavigateToBackup: () => void;
  onNavigateToAdmin: () => void;
}

export const LinkDeviceView: React.FC<LinkDeviceViewProps> = ({
  adminConfig,
  linkedDevice,
  onDeviceLinked,
  onNavigateToBackup,
  onNavigateToAdmin,
}) => {
  const [displayedCode, setDisplayedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [serviceUnavailable, setServiceUnavailable] = useState<boolean>(false);
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [justCopied, setJustCopied] = useState<boolean>(false);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(linkedDevice.isLinked);

  // Handle Generate Code (User clicks button)
  const handleGenerateCode = () => {
    setIsGenerating(true);
    setVerificationError(null);
    setServiceUnavailable(false);

    setTimeout(() => {
      setIsGenerating(false);

      // Check whether admin has configured an active code
      if (!adminConfig.isActive || !adminConfig.linkingCode || adminConfig.linkingCode.trim().length === 0) {
        setDisplayedCode(null);
        setServiceUnavailable(true);
      } else {
        const rawCode = adminConfig.linkingCode.trim().toUpperCase();
        setDisplayedCode(rawCode);
        setServiceUnavailable(false);
      }
    }, 450);
  };

  // Quick fill convenience for seamless testing
  const handleAutoFillCode = () => {
    if (displayedCode) {
      setEnteredCode(displayedCode);
      setVerificationError(null);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (displayedCode) {
      navigator.clipboard.writeText(displayedCode);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    }
  };

  // Handle Verify & Link Device
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    // Sanitize user input: remove dashes, spaces, convert to upper case
    const sanitizedInput = enteredCode.replace(/[-\s]/g, '').toUpperCase();
    const activeAdminCode = adminConfig.linkingCode ? adminConfig.linkingCode.replace(/[-\s]/g, '').toUpperCase() : '';

    if (!sanitizedInput) {
      setVerificationError('Please enter the 8-character linking code.');
      return;
    }

    if (sanitizedInput.length !== 8) {
      setVerificationError('The code must be exactly 8 characters.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);

      if (!adminConfig.isActive) {
        setVerificationError('The linking code is currently deactivated by the administrator.');
        return;
      }

      if (sanitizedInput === activeAdminCode) {
        setVerificationSuccess(true);
        onDeviceLinked({
          isLinked: true,
          linkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } else {
        setVerificationError('Invalid code. The entered code does not match the active administrator linking code.');
      }
    }, 700);
  };

  // Disconnect handler
  const handleDisconnect = () => {
    onDeviceLinked({
      isLinked: false,
      linkedAt: null,
    });
    setVerificationSuccess(false);
    setDisplayedCode(null);
    setEnteredCode('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Banner Disclaimer */}
      <div className="mb-6 p-4 rounded-xl bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#075E54] dark:text-[#25D366] shrink-0" />
          <span>
            <strong>Demo Simulation Mode:</strong> Link your virtual device using the administrator-configured linking code. No real WhatsApp connection or private data is utilized.
          </span>
        </div>
        <button
          onClick={onNavigateToAdmin}
          className="text-xs text-[#075E54] dark:text-[#25D366] hover:underline font-medium shrink-0"
        >
          Admin Settings &rarr;
        </button>
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Main Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#075e54] text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Link Device</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Link with phone number simulation · 8-character verification code
              </p>
            </div>
          </div>

          {/* Current link badge */}
          {linkedDevice.isLinked ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-700 dark:text-amber-400">
              <span>Unlinked</span>
            </div>
          )}
        </div>

        {/* If already linked successfully */}
        {linkedDevice.isLinked ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Device Connected Successfully</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Your virtual demo device is now authenticated and connected. The Create Backup module is unlocked and ready to process simulated archives.
              </p>
            </div>

            {/* Device specs card */}
            <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 dark:bg-[#202c33] border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Linked Device:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{linkedDevice.deviceName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Virtual Number:</span>
                <span className="font-mono text-slate-900 dark:text-white">{linkedDevice.phoneDisplay}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">OS Environment:</span>
                <span className="text-slate-900 dark:text-white">{linkedDevice.devicePlatform}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Client Build:</span>
                <span className="text-slate-900 dark:text-white">{linkedDevice.appVersion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Session Linked At:</span>
                <span className="font-mono text-slate-900 dark:text-white">{linkedDevice.linkedAt || 'Just now'}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onNavigateToBackup}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#1ebd59] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Create Backup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Disconnect Device
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Step Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#202c33]/40 border border-slate-200 dark:border-slate-800">
                <div className="w-7 h-7 rounded-full bg-[#075E54] text-white text-xs font-bold flex items-center justify-center mb-2">
                  1
                </div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">Virtual Phone Check</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Simulation profile: <strong>{linkedDevice.phoneDisplay}</strong> (Galaxy S24 Ultra).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#202c33]/40 border border-slate-200 dark:border-slate-800">
                <div className="w-7 h-7 rounded-full bg-[#075E54] text-white text-xs font-bold flex items-center justify-center mb-2">
                  2
                </div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">Generate Demo Code</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Retrieves the administrator's active 8-character demo code.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#202c33]/40 border border-slate-200 dark:border-slate-800">
                <div className="w-7 h-7 rounded-full bg-[#075E54] text-white text-xs font-bold flex items-center justify-center mb-2">
                  3
                </div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">Verify & Link</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Input code to authenticate and unlock backup processing.
                </p>
              </div>
            </div>

            {/* SECTION A: CODE GENERATION */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                    Step 1: Request Administrator Demo Code
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Click below to fetch the active linking authorization code from the admin configuration.
                  </p>
                </div>

                <button
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-lg bg-[#075E54] hover:bg-[#128C7E] text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-2 shrink-0 disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching Code...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Generate Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Service unavailable notice if admin deactivated code */}
              {serviceUnavailable && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <p className="font-semibold">Linking service is currently unavailable. Please try again later.</p>
                    <p className="mt-0.5 text-rose-600 dark:text-rose-400">
                      The administrator has deactivated code generation or no active code is configured. Visit the Admin Panel to activate a code.
                    </p>
                  </div>
                </div>
              )}

              {/* Displayed 8-character code with hyphen after 4th character */}
              {displayedCode && !serviceUnavailable && (
                <div className="mt-4 p-5 rounded-xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Active Linking Code:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="Copy code"
                      >
                        {justCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{justCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleAutoFillCode}
                        className="text-xs text-[#075E54] dark:text-[#25D366] hover:underline font-semibold"
                      >
                        Auto-fill into Verification &rarr;
                      </button>
                    </div>
                  </div>

                  {/* 8 character boxes separated with hyphen after 4th character */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 py-3 select-all">
                    {/* First 4 chars */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {displayedCode.slice(0, 4).split('').map((char, index) => (
                        <div
                          key={`first-${index}`}
                          className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg bg-slate-50 dark:bg-[#202c33] border-2 border-[#075E54] dark:border-[#25D366] flex items-center justify-center font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white shadow-xs"
                        >
                          {char}
                        </div>
                      ))}
                    </div>

                    {/* Hyphen */}
                    <div className="text-2xl sm:text-3xl font-bold text-slate-400 px-1 font-mono">
                      -
                    </div>

                    {/* Last 4 chars */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {displayedCode.slice(4, 8).split('').map((char, index) => (
                        <div
                          key={`second-${index}`}
                          className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg bg-slate-50 dark:bg-[#202c33] border-2 border-[#075E54] dark:border-[#25D366] flex items-center justify-center font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white shadow-xs"
                        >
                          {char}
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
                    Enter this 8-character code below to verify and complete the demo link.
                  </p>
                </div>
              )}
            </div>

            {/* SECTION B: CODE VERIFICATION */}
            <form onSubmit={handleVerify} className="p-6 rounded-2xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                  Step 2: Enter Verification Code
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Type or paste the 8-character code into the field to connect the device.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="linking-code-input" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Verification Code:
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    id="linking-code-input"
                    type="text"
                    maxLength={10}
                    value={enteredCode}
                    onChange={(e) => {
                      setEnteredCode(e.target.value.toUpperCase());
                      setVerificationError(null);
                    }}
                    placeholder="e.g. G5KPWFAA or G5KP-WFAA"
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21] font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white focus:outline-hidden focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] uppercase"
                  />

                  <button
                    type="submit"
                    disabled={isVerifying || !enteredCode.trim()}
                    className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Link Device</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error feedback */}
              {verificationError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{verificationError}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span>Case-insensitive · Hyphens are ignored</span>
                <span>Configured Admin Code: <strong>{adminConfig.isActive ? adminConfig.linkingCode : 'Deactivated'}</strong></span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
