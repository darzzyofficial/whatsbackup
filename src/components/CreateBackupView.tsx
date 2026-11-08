import React, { useState } from 'react';
import { Lock, ArrowRight, MessageSquare, Users, Image as ImageIcon, Video, CheckSquare, Square, Eye, ShieldCheck, Database, Smartphone } from 'lucide-react';
import { BackupCategory, CategoryId, LinkedDevice } from '../types';

interface CreateBackupViewProps {
  linkedDevice: LinkedDevice;
  categories: BackupCategory[];
  onToggleCategory: (id: CategoryId) => void;
  onSelectAll: (select: boolean) => void;
  onStartBackup: () => void;
  onNavigateToLink: () => void;
  onPreviewCategory: (id: CategoryId) => void;
}

export const CreateBackupView: React.FC<CreateBackupViewProps> = ({
  linkedDevice,
  categories,
  onToggleCategory,
  onSelectAll,
  onStartBackup,
  onNavigateToLink,
  onPreviewCategory,
}) => {
  // If not linked, show locked state!
  if (!linkedDevice.isLinked) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-5">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Backup is Locked</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Device linking is required before initiating a backup. Complete the simulated phone number linking step to authorize data extraction.
          </p>

          {/* Quick locked preview */}
          <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-[#202c33]/40 border border-slate-200 dark:border-slate-800 max-w-md mx-auto text-left text-xs space-y-2 opacity-60">
            <div className="flex items-center justify-between text-slate-500">
              <span>Required State:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">Device Unlinked</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Protected Datasets:</span>
              <span>Messages, Contacts, Photos, Videos</span>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={onNavigateToLink}
              className="px-6 py-2.5 rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white font-medium text-xs shadow-md transition-all inline-flex items-center gap-2"
            >
              <span>Go to Link Device</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate selected totals
  const selectedCategories = categories.filter((c) => c.selected);
  const totalSizeBytes = selectedCategories.reduce((sum, c) => sum + c.sizeBytes, 0);
  const totalItemCount = selectedCategories.reduce((sum, c) => sum + c.itemCount, 0);

  // Format total size
  const totalSizeFormatted =
    totalSizeBytes > 1024 * 1024 * 1024
      ? `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  const allSelected = categories.every((c) => c.selected);

  const getCategoryIcon = (id: CategoryId) => {
    switch (id) {
      case 'messages':
        return <MessageSquare className="w-5 h-5 text-[#075E54] dark:text-[#25D366]" />;
      case 'contacts':
        return <Users className="w-5 h-5 text-[#075E54] dark:text-[#25D366]" />;
      case 'photos':
        return <ImageIcon className="w-5 h-5 text-[#075E54] dark:text-[#25D366]" />;
      case 'videos':
        return <Video className="w-5 h-5 text-[#075E54] dark:text-[#25D366]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Active Link Banner */}
      <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#075E54] text-white flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-[#25D366]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {linkedDevice.deviceName}
              </span>
              <span className="text-[10px] bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-full">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Virtual device authenticated · Ready for simulation backup
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToLink}
          className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium underline"
        >
          Device Details
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#202c33] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Create Backup</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select fictional data categories to include in the backup archive.
            </p>
          </div>

          {/* Select all toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectAll(!allSelected)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-[#25D366]" /> : <Square className="w-3.5 h-3.5" />}
              <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`p-4 rounded-xl border transition-all ${
                  cat.selected
                    ? 'border-[#25D366] bg-emerald-50/20 dark:bg-[#202c33]'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111b21] opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => onToggleCategory(cat.id)}
                    className="flex items-start gap-3 flex-1 text-left"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {cat.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {cat.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {cat.itemCount.toLocaleString()} items
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#075E54] dark:text-[#25D366] font-semibold tabular-nums">
                          {cat.sizeFormatted}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Actions column */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={cat.selected}
                      onChange={() => onToggleCategory(cat.id)}
                      className="w-4 h-4 text-[#25D366] accent-[#25D366] rounded cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onPreviewCategory(cat.id)}
                      className="flex items-center gap-1 text-[11px] text-[#075E54] dark:text-[#25D366] hover:underline pt-2"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Backup Summary Bar */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Backup Selection Summary
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{selectedCategories.length} of {categories.length} categories</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{totalItemCount.toLocaleString()} total items</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Total Demo Size</span>
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {totalSizeFormatted}
                </span>
              </div>

              <button
                onClick={onStartBackup}
                disabled={selectedCategories.length === 0}
                className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Start Backup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="px-6 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#075E54] dark:text-[#25D366] shrink-0" />
          <span>
            Simulated local backup execution. No real data or networks are accessed.
          </span>
        </div>
      </div>
    </div>
  );
};
