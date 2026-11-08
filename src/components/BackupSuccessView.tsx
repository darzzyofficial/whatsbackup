import React from 'react';
import { CheckCircle2, Download, Eye, RotateCcw, ShieldCheck, HardDrive, Smartphone, Hash, Calendar, Layers } from 'lucide-react';
import { BackupRecord } from '../types';
import { downloadReportFile } from '../utils/reportGenerator';

interface BackupSuccessViewProps {
  record: BackupRecord;
  onViewReport: (record: BackupRecord) => void;
  onCreateNewBackup: () => void;
}

export const BackupSuccessView: React.FC<BackupSuccessViewProps> = ({
  record,
  onViewReport,
  onCreateNewBackup,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Transparency Disclaimer */}
      <div className="mb-6 p-4 rounded-xl bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#075E54] dark:text-[#25D366] shrink-0" />
        <span>
          WhatsBackup is an independent demonstration platform. It does not connect to WhatsApp or access real user accounts or personal data.
        </span>
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="bg-[#075E54] text-white p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-[#25D366] text-white mx-auto flex items-center justify-center shadow-lg mb-4 ring-8 ring-white/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Backup Completed Successfully</h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-md mx-auto">
            All selected simulated categories have been packed, indexed, and cryptographically verified.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-mono font-medium tracking-wide">
            <span>Archive ID:</span>
            <strong>{record.id}</strong>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Main Key Figures */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202c33] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#075E54] dark:text-[#25D366]" />
                Date & Time
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {record.date}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                Duration: {record.durationSeconds}s
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202c33] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-[#075E54] dark:text-[#25D366]" />
                Demo Device
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {record.deviceName}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Connected · 100% Verified
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202c33] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-[#075E54] dark:text-[#25D366]" />
                Total Archive Size
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {record.totalSizeFormatted}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {record.totalSizeBytes.toLocaleString()} B
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202c33] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <Layers className="w-3.5 h-3.5 text-[#075E54] dark:text-[#25D366]" />
                Completion Rate
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                100% Complete
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {record.categories.length} Categories
              </div>
            </div>
          </div>

          {/* Categories Summary List */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
              Included Categories Breakdown:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {record.categories.map((cat) => {
                const count = record.itemSummary[cat] !== undefined ? `${record.itemSummary[cat]?.toLocaleString()} items` : 'Included';
                return (
                  <div
                    key={cat}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700/60"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize block">
                      {cat}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SHA-256 Checksum */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 mb-1">
              <Hash className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Simulated SHA-256 Checksum:</span>
            </div>
            <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-[#202c33] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              {record.checksum}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onViewReport(record)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white font-medium text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>View Detailed Report</span>
            </button>

            <button
              onClick={() => downloadReportFile(record)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white font-medium text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Report (.TXT)</span>
            </button>

            <button
              onClick={onCreateNewBackup}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Create New Backup</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Archive securely committed to simulated local repository.
        </div>
      </div>
    </div>
  );
};
