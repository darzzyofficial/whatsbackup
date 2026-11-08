import React, { useState } from 'react';
import { X, Download, Printer, ShieldCheck, HardDrive, CheckCircle2, MessageSquare, Users, Image as ImageIcon, Video, Hash, Smartphone } from 'lucide-react';
import { BackupRecord } from '../types';
import { SAMPLE_CHAT_THREADS, SAMPLE_CONTACTS, SAMPLE_MEDIA } from '../data/sampleData';
import { downloadReportFile } from '../utils/reportGenerator';

interface ReportViewerModalProps {
  record: BackupRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'chats' | 'contacts' | 'media'>('summary');
  const [selectedThreadId, setSelectedThreadId] = useState<string>(SAMPLE_CHAT_THREADS[0].id);

  if (!isOpen || !record) return null;

  const currentThread = SAMPLE_CHAT_THREADS.find((t) => t.id === selectedThreadId) || SAMPLE_CHAT_THREADS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[94vh] bg-white dark:bg-[#111b21] rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#202c33] gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#075e54] text-[#25D366] flex items-center justify-center font-mono font-bold text-xs sm:text-sm shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  Backup Report: {record.id}
                </h2>
                <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  {record.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                <span>{record.date}</span>
                <span aria-hidden="true">·</span>
                <span>Fictional Demo Archive</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => downloadReportFile(record)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white bg-[#075E54] hover:bg-[#128C7E] rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .TXT</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Print Report"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              aria-label="Close report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111b21] px-2 sm:px-6 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-colors shrink-0 ${
              activeTab === 'summary'
                ? 'border-[#25D366] text-[#075E54] dark:text-[#25D366]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Overview & Checksum
          </button>
          {record.categories.includes('messages') && (
            <button
              onClick={() => setActiveTab('chats')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'chats'
                  ? 'border-[#25D366] text-[#075E54] dark:text-[#25D366]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Archived Chats ({record.itemSummary.messages?.toLocaleString() || 1150})
            </button>
          )}
          {record.categories.includes('contacts') && (
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'contacts'
                  ? 'border-[#25D366] text-[#075E54] dark:text-[#25D366]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Contacts List ({record.itemSummary.contacts || 320})
            </button>
          )}
          {(record.categories.includes('photos') || record.categories.includes('videos')) && (
            <button
              onClick={() => setActiveTab('media')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'media'
                  ? 'border-[#25D366] text-[#075E54] dark:text-[#25D366]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Media Assets Archive
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0c1317]">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-[#075E54] dark:text-[#25D366]" />
                    Archive Status
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {record.status}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#075E54] dark:text-[#25D366]" />
                    Device
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    Android Phone
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Process Duration
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {record.durationSeconds}s
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Local rate
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#075E54] dark:text-[#25D366]" />
                    Categories Saved
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {record.categories.length} of 4
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {record.categories.join(' ')}
                  </div>
                </div>
              </div>

              {/* Integrity checksum box */}
              <div className="p-4 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                  Cryptographic Integrity & Checksum
                </h4>
                <div className="p-3 bg-slate-100 dark:bg-[#202c33] rounded-lg font-mono text-xs break-all text-slate-700 dark:text-slate-300">
                  {record.checksum}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span>Algorithm: SHA-256</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Integrity: Verified</span>
                </div>
              </div>

              {/* Items Breakdown List */}
              <div className="bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 dark:bg-[#202c33]/50 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Archived Category Quantities
                </div>
                {record.categories.includes('messages') && (
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <MessageSquare className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                      <span>Chat Messages & Threads</span>
                    </div>
                    <span className="font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                      {record.itemSummary.messages?.toLocaleString() || '1,150'} messages (48.2 MB)
                    </span>
                  </div>
                )}
                {record.categories.includes('contacts') && (
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Users className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                      <span>Contacts & vCards</span>
                    </div>
                    <span className="font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                      {record.itemSummary.contacts || 320} contacts (2.5 MB)
                    </span>
                  </div>
                )}
                {record.categories.includes('photos') && (
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <ImageIcon className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                      <span>Photo Files</span>
                    </div>
                    <span className="font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                      {record.itemSummary.photos?.toLocaleString() || '480'} photos (185.0 MB)
                    </span>
                  </div>
                )}
                {record.categories.includes('videos') && (
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Video className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                      <span>Video Clips</span>
                    </div>
                    <span className="font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                      {record.itemSummary.videos || 35} videos (120.0 MB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[440px] bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {SAMPLE_CHAT_THREADS.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`w-full text-left p-3 flex items-start gap-3 hover:bg-slate-100 dark:hover:bg-[#202c33] transition-colors ${
                        selectedThreadId === thread.id ? 'bg-[#e7f8ee] dark:bg-[#202c33]' : ''
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full ${thread.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                        {thread.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-medium text-slate-900 dark:text-white truncate">{thread.name}</h4>
                          <span className="text-[10px] text-slate-400 tabular-nums">{thread.lastTime}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{thread.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-7 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-slate-900 dark:text-white">{currentThread.name}</h5>
                  <span className="text-[11px] text-slate-400">Backed-up record</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {currentThread.messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-xs shadow-xs ${
                          msg.isMe
                            ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-none'
                            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-none'
                        }`}
                      >
                        {!msg.isMe && (
                          <p className="text-[10px] font-semibold text-[#075E54] dark:text-[#25D366] mb-0.5">
                            {msg.sender}
                          </p>
                        )}
                        <p className="leading-relaxed">{msg.text}</p>
                        <span className="block text-right text-[10px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Contact roster extracted during backup run ({record.itemSummary.contacts || 320} contacts).
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SAMPLE_CONTACTS.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs"
                  >
                    <div className={`w-9 h-9 rounded-full ${c.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">{c.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SAMPLE_MEDIA.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
                  >
                    <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-2">
                      {m.type === 'photo' ? (
                        <ImageIcon className="w-7 h-7 text-[#075E54] dark:text-[#25D366]" />
                      ) : (
                        <Video className="w-7 h-7 text-[#075E54] dark:text-[#25D366]" />
                      )}
                    </div>
                    <p className="text-xs font-mono font-medium text-slate-900 dark:text-white truncate">{m.title}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{m.size}</span>
                      <span>{m.type.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Archive ID: {record.id} · SHA-256 Verified
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
