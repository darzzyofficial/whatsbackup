import React, { useState } from 'react';
import { History, Search, Download, Eye, ShieldCheck, HardDrive, Smartphone, Trash2 } from 'lucide-react';
import { BackupRecord } from '../types';
import { downloadReportFile } from '../utils/reportGenerator';

interface BackupHistoryViewProps {
  records: BackupRecord[];
  onViewReport: (record: BackupRecord) => void;
  onClearHistory: () => void;
  onNavigateToBackup: () => void;
}

export const BackupHistoryView: React.FC<BackupHistoryViewProps> = ({
  records,
  onViewReport,
  onClearHistory,
  onNavigateToBackup,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.date.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === 'all' ||
      r.categories.includes(selectedCategoryFilter as any);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Top Banner */}
      <div className="mb-6 p-4 rounded-xl bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#075E54] dark:text-[#25D366] shrink-0" />
          <span>
            <strong>Simulated History Vault:</strong> All records are fictional demonstrations and stored locally in demo state.
          </span>
        </div>
        {records.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#202c33] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#075e54] text-white flex items-center justify-center">
              <History className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Backup History</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit trail of completed fictional backup archives ({records.length} records)
              </p>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search archive ID or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#25D366]"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-[#25D366]"
            >
              <option value="all">All Categories</option>
              <option value="messages">Messages</option>
              <option value="contacts">Contacts</option>
              <option value="photos">Photos</option>
              <option value="videos">Videos</option>
            </select>
          </div>
        </div>

        {/* Content Table / List */}
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <History className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Backup Records Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchTerm || selectedCategoryFilter !== 'all'
                ? 'Try adjusting your search criteria or category filter.'
                : 'You have not executed any simulated backup operations yet.'}
            </p>
            <div className="pt-2">
              <button
                onClick={onNavigateToBackup}
                className="px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#1ebd59] text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Create First Backup
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#202c33]/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Archive ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4">Categories</th>
                  <th className="py-3 px-4 text-right">Size</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#202c33]/40 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {r.id}
                    </td>

                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                      {r.date}
                    </td>

                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap flex items-center gap-1.5 mt-2">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px]">{r.deviceName}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {r.categories.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 uppercase font-medium"
                          >
                            {c.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap tabular-nums">
                      {r.totalSizeFormatted}
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {r.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewReport(r)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#075E54] hover:bg-[#128C7E] text-white text-[11px] font-medium transition-colors"
                          title="View detailed report"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </button>
                        <button
                          onClick={() => downloadReportFile(r)}
                          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Download .TXT report"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Showing {filteredRecords.length} of {records.length} archives</span>
          <span>Cryptographic format: Simulated AES-256-GCM</span>
        </div>
      </div>
    </div>
  );
};
