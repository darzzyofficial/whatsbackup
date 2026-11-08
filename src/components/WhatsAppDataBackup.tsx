import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, HardDrive, CheckCircle2, Download, Play, Pause, X, ArrowRight, RotateCcw, MessageSquare, Users, Image as ImageIcon, Video, ShieldCheck } from 'lucide-react';
import { BackupCategory, BackupRecord, CategoryId, LinkedDevice } from '../types';
import { downloadReportFile } from '../utils/reportGenerator';

interface WhatsAppDataBackupProps {
  linkedDevice: LinkedDevice;
  categories: BackupCategory[];
  onToggleCategory: (id: CategoryId) => void;
  onSelectAll: (select: boolean) => void;
  onGoToLinkDevice: () => void;
  onBackupComplete: (record: BackupRecord) => void;
  onViewReport: (record: BackupRecord) => void;
}

export const WhatsAppDataBackup: React.FC<WhatsAppDataBackupProps> = ({
  linkedDevice,
  categories,
  onToggleCategory,
  onSelectAll,
  onGoToLinkDevice,
  onBackupComplete,
  onViewReport,
}) => {
  // Backup flow states: 'select' | 'running' | 'completed'
  const [backupState, setBackupState] = useState<'select' | 'running' | 'completed'>('select');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStageText, setCurrentStageText] = useState('Preparing backup archive...');
  const [latestRecord, setLatestRecord] = useState<BackupRecord | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const selectedCategories = categories.filter((c) => c.selected);
  const totalSizeBytes = selectedCategories.reduce((sum, c) => sum + c.sizeBytes, 0);
  const allSelected = categories.every((c) => c.selected);

  const totalSizeFormatted =
    totalSizeBytes > 1024 * 1024 * 1024
      ? `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  // Start backup
  const handleStartBackup = () => {
    if (selectedCategories.length === 0) return;
    setBackupState('running');
    setProgress(0);
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  // Pause / Resume
  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  // Cancel backup
  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setBackupState('select');
    setProgress(0);
    setIsPaused(false);
  };

  // Run simulation
  useEffect(() => {
    if (backupState !== 'running') return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (isPaused) return prev;

        const next = prev + 2;

        // Update stage text in simple English
        if (next < 15) {
          setCurrentStageText('Preparing backup archive...');
        } else if (next < 40) {
          setCurrentStageText('Saving chat messages & groups...');
        } else if (next < 60) {
          setCurrentStageText('Saving contacts & address book...');
        } else if (next < 80) {
          setCurrentStageText('Saving photos & images...');
        } else if (next < 95) {
          setCurrentStageText('Saving videos & media clips...');
        } else {
          setCurrentStageText('Verifying backup integrity...');
        }

        if (next >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);

          setTimeout(() => {
            const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000) || 12;
            const randomId = `WB-2026-${Math.floor(1000 + Math.random() * 9000)}-S1`;
            const randomChecksum = Array.from({ length: 64 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join('');

            const itemSummary: Record<string, number> = {};
            selectedCategories.forEach((cat) => {
              itemSummary[cat.id] = cat.itemCount;
            });

            const newRecord: BackupRecord = {
              id: randomId,
              date: 'Just now',
              timestamp: Date.now(),
              totalSizeBytes,
              totalSizeFormatted,
              categories: selectedCategories.map((c) => c.id),
              status: 'Completed',
              itemSummary,
              checksum: randomChecksum,
              durationSeconds: elapsed,
              deviceName: linkedDevice.deviceName,
            };

            setLatestRecord(newRecord);
            onBackupComplete(newRecord);
            setBackupState('completed');
          }, 400);

          return 100;
        }

        return next;
      });
    }, 180);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [backupState, isPaused]);

  // If not linked yet, show clean guidance screen
  if (!linkedDevice.isLinked) {
    return (
      <div className="py-12 px-4 sm:px-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-[#00a884]/15 text-[#00a884] mx-auto flex items-center justify-center mb-4">
          <Smartphone className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-[#111b21] dark:text-white mb-2">
          Link Your Device First
        </h2>
        <p className="text-sm text-[#667781] dark:text-[#8696a0] mb-6 leading-relaxed">
          Please link your phone in Step 1 to create your WhatsApp data backup.
        </p>

        <button
          onClick={onGoToLinkDevice}
          className="px-6 py-2.5 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white font-semibold text-sm shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Go to Link Device (Step 1)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 1. SELECT DATA SCREEN
  if (backupState === 'select') {
    return (
      <div className="py-3 px-1 sm:px-6 max-w-2xl mx-auto space-y-4 sm:space-y-6 w-full">
        
        {/* Connected Device Status Banner */}
        <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-[#25D366]/10 dark:bg-[#202c33] border border-[#25D366]/30 text-xs text-[#111b21] dark:text-white">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse"></span>
            <div>
              <span className="font-semibold block text-xs sm:text-sm">Android Phone</span>
              <span className="text-[11px] sm:text-xs text-[#667781] dark:text-[#8696a0]">
                {linkedDevice.phoneDisplay ? `${linkedDevice.phoneDisplay} · ` : ''}Ready
              </span>
            </div>
          </div>
          <span className="text-[#00a884] dark:text-[#25D366] font-semibold text-[10px] sm:text-[11px] bg-white dark:bg-[#111b21] px-2 py-0.5 rounded-full shadow-xs">
            Linked
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111b21] dark:text-white tracking-tight">
            Create Data Backup
          </h2>
          <p className="text-xs sm:text-sm text-[#667781] dark:text-[#8696a0] mt-1">
            Choose what you want to include in this backup:
          </p>
        </div>

        {/* Categories list */}
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-[#667781] dark:text-[#8696a0]">
            <span>Select items:</span>
            <button
              onClick={() => onSelectAll(!allSelected)}
              className="text-[#00a884] dark:text-[#25D366] font-semibold hover:underline cursor-pointer"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-2.5 sm:gap-3 cursor-pointer transition-colors ${
                  cat.selected
                    ? 'border-[#00a884] bg-[#f0f2f5] dark:bg-[#202c33]'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111b21] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#111b21] text-[#00a884] shadow-xs shrink-0">
                    {cat.id === 'messages' && <MessageSquare className="w-5 h-5" />}
                    {cat.id === 'contacts' && <Users className="w-5 h-5" />}
                    {cat.id === 'photos' && <ImageIcon className="w-5 h-5" />}
                    {cat.id === 'videos' && <Video className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#111b21] dark:text-white">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={cat.selected}
                  onChange={() => onToggleCategory(cat.id)}
                  className="w-4 h-4 accent-[#00a884] rounded cursor-pointer shrink-0"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Start Backup button without numbers */}
        <div className="pt-2 flex justify-center sm:justify-end">
          <button
            onClick={handleStartBackup}
            disabled={selectedCategories.length === 0}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start Backup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. RUNNING BACKUP SIMULATION
  if (backupState === 'running') {
    return (
      <div className="py-12 px-4 sm:px-8 max-w-lg mx-auto text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111b21] dark:text-white">
            Backing up your data...
          </h2>
          <p className="text-xs font-medium text-[#00a884] dark:text-[#25D366] mt-1 min-h-[1.25rem]">
            {currentStageText}
          </p>
        </div>

        {/* Big percentage */}
        <div className="text-5xl font-extrabold font-mono text-[#111b21] dark:text-white tabular-nums">
          {progress}%
        </div>

        {/* WhatsApp Green Progress Bar */}
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-[#25D366] rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls: Pause / Resume & Cancel */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleTogglePause}
            className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-[#111b21] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-full border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. BACKUP COMPLETED SCREEN
  return (
    <div className="py-8 px-4 sm:px-8 max-w-xl mx-auto text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-[#25D366]/20 text-[#00a884] dark:text-[#25D366] mx-auto flex items-center justify-center mb-2 ring-8 ring-[#25D366]/10">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[#111b21] dark:text-white">
          Backup Completed Successfully!
        </h2>
        <p className="text-sm text-[#667781] dark:text-[#8696a0] mt-1">
          All selected items from your phone have been backed up.
        </p>
      </div>

      {latestRecord && (
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] rounded-xl p-4 text-left text-xs space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between">
            <span className="text-[#667781] dark:text-[#8696a0]">Device:</span>
            <span className="font-semibold text-[#111b21] dark:text-white">Android Phone</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#667781] dark:text-[#8696a0]">Backup ID:</span>
            <span className="font-mono font-bold text-[#111b21] dark:text-white">{latestRecord.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#667781] dark:text-[#8696a0]">Categories Saved:</span>
            <span className="font-medium text-[#111b21] dark:text-white capitalize">{latestRecord.categories.join(' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#667781] dark:text-[#8696a0]">Status:</span>
            <span className="text-[#00a884] dark:text-[#25D366] font-semibold">Completed</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {latestRecord && (
          <button
            onClick={() => downloadReportFile(latestRecord)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup Report (.TXT)</span>
          </button>
        )}

        {latestRecord && (
          <button
            onClick={() => onViewReport(latestRecord)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-[#111b21] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            View Summary
          </button>
        )}

        <button
          onClick={() => setBackupState('select')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-[#667781] dark:text-[#8696a0] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Backup</span>
        </button>
      </div>
    </div>
  );
};
