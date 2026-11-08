import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, ShieldCheck, CheckCircle2, Loader2, HardDrive, Clock, FileArchive, AlertCircle } from 'lucide-react';
import { BackupCategory, BackupRecord, BackupStage } from '../types';

interface BackupSimulationModalProps {
  isOpen: boolean;
  categories: BackupCategory[];
  deviceName: string;
  onCancel: () => void;
  onComplete: (record: BackupRecord) => void;
}

export const BackupSimulationModal: React.FC<BackupSimulationModalProps> = ({
  isOpen,
  categories,
  deviceName,
  onCancel,
  onComplete,
}) => {
  const selectedCategories = categories.filter((c) => c.selected);
  const totalSizeBytes = selectedCategories.reduce((acc, c) => acc + c.sizeBytes, 0);
  const totalItemsCount = selectedCategories.reduce((acc, c) => acc + c.itemCount, 0);

  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<BackupStage>('preparing');
  const [currentBytes, setCurrentBytes] = useState<number>(0);
  const [currentItemCount, setCurrentItemCount] = useState<number>(0);
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState<number>(18);
  const [statusMessage, setStatusMessage] = useState<string>('Preparing virtual backup container...');
  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup stages list based on which categories are selected
  const stageSequence: { stage: BackupStage; label: string; minProgress: number; maxProgress: number }[] = [
    { stage: 'preparing', label: 'Preparing backup archive container...', minProgress: 0, maxProgress: 10 },
  ];

  let currentMin = 10;
  const activeCatIds = selectedCategories.map((c) => c.id);
  const totalSteps = activeCatIds.length;
  const stepSlice = 75 / (totalSteps || 1);

  if (activeCatIds.includes('messages')) {
    stageSequence.push({
      stage: 'messages',
      label: 'Processing messages & chat conversations...',
      minProgress: currentMin,
      maxProgress: currentMin + stepSlice,
    });
    currentMin += stepSlice;
  }
  if (activeCatIds.includes('contacts')) {
    stageSequence.push({
      stage: 'contacts',
      label: 'Processing contacts & vCards...',
      minProgress: currentMin,
      maxProgress: currentMin + stepSlice,
    });
    currentMin += stepSlice;
  }
  if (activeCatIds.includes('photos')) {
    stageSequence.push({
      stage: 'photos',
      label: 'Processing camera roll & photo media...',
      minProgress: currentMin,
      maxProgress: currentMin + stepSlice,
    });
    currentMin += stepSlice;
  }
  if (activeCatIds.includes('videos')) {
    stageSequence.push({
      stage: 'videos',
      label: 'Processing video clips & attachments...',
      minProgress: currentMin,
      maxProgress: currentMin + stepSlice,
    });
    currentMin += stepSlice;
  }

  stageSequence.push({
    stage: 'verifying',
    label: 'Verifying cryptographic checksum (SHA-256)...',
    minProgress: 85,
    maxProgress: 99,
  });

  stageSequence.push({
    stage: 'completed',
    label: 'Backup completed successfully!',
    minProgress: 100,
    maxProgress: 100,
  });

  // Simulation tick
  useEffect(() => {
    if (!isOpen) return;

    // Reset when opened
    setProgress(0);
    setIsPaused(false);
    setCurrentBytes(0);
    setCurrentItemCount(0);
    setCurrentStage('preparing');
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (isPaused) return prev;

        // Increment smoothly
        const next = Math.min(prev + 1.25, 100);

        // Find stage
        const matchingStage = stageSequence.find(
          (s) => next >= s.minProgress && next <= s.maxProgress
        ) || stageSequence[stageSequence.length - 1];

        setCurrentStage(matchingStage.stage);
        setStatusMessage(matchingStage.label);

        // Calculate proportional bytes and items
        const ratio = next / 100;
        setCurrentBytes(Math.round(ratio * totalSizeBytes));
        setCurrentItemCount(Math.round(ratio * totalItemsCount));

        // Estimated seconds
        const remaining = Math.max(0, Math.round(((100 - next) / 100) * 18));
        setEstimatedSecondsRemaining(remaining);

        if (next >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);

          // Trigger completion after a brief settling pause
          setTimeout(() => {
            const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000) || 16;
            const randomHex = Array.from({ length: 64 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join('');

            const randomIdNum = Math.floor(1000 + Math.random() * 9000);
            const backupId = `WB-2026-${randomIdNum}-S${Math.floor(1 + Math.random() * 9)}`;

            const formattedSize =
              totalSizeBytes > 1024 * 1024 * 1024
                ? `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
                : `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

            const itemSummary: Record<string, number> = {};
            selectedCategories.forEach((cat) => {
              itemSummary[cat.id] = cat.itemCount;
            });

            const newRecord: BackupRecord = {
              id: backupId,
              date: 'Just now',
              timestamp: Date.now(),
              totalSizeBytes,
              totalSizeFormatted: formattedSize,
              categories: selectedCategories.map((c) => c.id),
              status: 'Completed',
              itemSummary,
              checksum: randomHex,
              durationSeconds: elapsed,
              deviceName,
            };

            onComplete(newRecord);
          }, 600);
        }

        return next;
      });
    }, 220);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused]);

  if (!isOpen) return null;

  const currentFormattedSize =
    currentBytes > 1024 * 1024 * 1024
      ? `${(currentBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : `${(currentBytes / (1024 * 1024)).toFixed(1)} MB`;

  const totalFormattedSize =
    totalSizeBytes > 1024 * 1024 * 1024
      ? `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  const stageDisplayNames: { [k in BackupStage]: string } = {
    idle: 'Idle',
    preparing: '1. Preparing Backup Container',
    messages: '2. Processing Chat Messages',
    contacts: '3. Processing Address Book Contacts',
    photos: '4. Processing Camera Photos',
    videos: '5. Packaging Video Clips',
    verifying: '6. Cryptographic Integrity Check',
    completed: '7. Backup Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#075e54] text-[#25D366] flex items-center justify-center">
              <FileArchive className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Processing Demo Backup
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Target: {deviceName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isPaused
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={() => setShowCancelPrompt(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Cancel Backup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Main Percentage Circle / Indicator */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative flex items-center justify-center mb-3">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
            <p className="text-xs font-medium text-[#075E54] dark:text-[#25D366] min-h-[1.25rem]">
              {statusMessage}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-100 dark:bg-[#202c33] rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
              <div
                className="h-full bg-[#25D366] rounded-full transition-all duration-200 ease-out shadow-xs"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>0%</span>
              <span className="tabular-nums">Stage: {stageDisplayNames[currentStage]}</span>
              <span>100%</span>
            </div>
          </div>

          {/* Process Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#202c33]/50 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Processed Size</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                {currentFormattedSize}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                / {totalFormattedSize}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Processed Items</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                {currentItemCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                / {totalItemsCount.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Time Remaining</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                {isPaused ? 'Paused' : `~00:${String(estimatedSecondsRemaining).padStart(2, '0')}`}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Local simulation
              </span>
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Processing Stages:
            </span>
            <div className="space-y-1.5 text-xs">
              {[
                { stage: 'preparing', label: '1. Preparing backup container' },
                { stage: 'messages', label: '2. Processing chat messages & conversations' },
                { stage: 'contacts', label: '3. Processing address book contacts' },
                { stage: 'photos', label: '4. Processing photo media archive' },
                { stage: 'videos', label: '5. Processing video files' },
                { stage: 'verifying', label: '6. Cryptographic integrity verification' },
                { stage: 'completed', label: '7. Backup completed' },
              ].map((step, idx) => {
                const isPassed =
                  progress === 100 ||
                  (step.stage === 'preparing' && progress > 10) ||
                  (step.stage === 'messages' && progress > 30) ||
                  (step.stage === 'contacts' && progress > 50) ||
                  (step.stage === 'photos' && progress > 70) ||
                  (step.stage === 'videos' && progress > 85) ||
                  (step.stage === 'verifying' && progress >= 99);

                const isCurrent = currentStage === step.stage;

                return (
                  <div key={step.stage} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#25D366] animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                      )}
                      <span className={isCurrent ? 'font-semibold text-slate-900 dark:text-white' : ''}>
                        {step.label}
                      </span>
                    </div>
                    {isPassed && <span className="text-[10px] text-emerald-600 font-mono">Done</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cancellation confirmation modal dialog overlay */}
        {showCancelPrompt && (
          <div className="absolute inset-0 bg-white/95 dark:bg-[#111b21]/95 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Cancel Simulated Backup?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Are you sure you want to cancel the current backup process? Any progress will be discarded.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelPrompt(false);
                  onCancel();
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
              >
                Yes, Cancel Backup
              </button>
              <button
                onClick={() => setShowCancelPrompt(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Resume Processing
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Simulated local background execution · Do not refresh window
        </div>
      </div>
    </div>
  );
};
