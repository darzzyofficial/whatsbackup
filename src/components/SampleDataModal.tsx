import React, { useState } from 'react';
import { X, MessageSquare, Users, Image as ImageIcon, Video, CheckCheck, Phone, FileText } from 'lucide-react';
import { SAMPLE_CHAT_THREADS, SAMPLE_CONTACTS, SAMPLE_MEDIA } from '../data/sampleData';
import { CategoryId } from '../types';

interface SampleDataModalProps {
  initialCategory?: CategoryId;
  isOpen: boolean;
  onClose: () => void;
}

export const SampleDataModal: React.FC<SampleDataModalProps> = ({
  initialCategory = 'messages',
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryId>(initialCategory);
  const [selectedThreadId, setSelectedThreadId] = useState<string>(SAMPLE_CHAT_THREADS[0].id);
  const [contactSearch, setContactSearch] = useState('');

  if (!isOpen) return null;

  const currentThread = SAMPLE_CHAT_THREADS.find((t) => t.id === selectedThreadId) || SAMPLE_CHAT_THREADS[0];

  const filteredContacts = SAMPLE_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#202c33]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#075e54] flex items-center justify-center text-white">
              <FileText className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Sample Data Inspection</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Fictional Simulated Vault</span>
                <span aria-hidden="true">·</span>
                <span>Demo Only</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111b21] px-6">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'messages'
                ? 'border-[#25D366] text-[#075E54] dark:text-[#25D366]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages ({SAMPLE_CHAT_THREADS.length} threads)</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'contacts'
                ? 'border-[#25D366] text-[#075E54] dark:text-[#25D366]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Contacts (640 sample)</span>
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-[#25D366] text-[#075E54] dark:text-[#25D366]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photos (1,280 files)</span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'videos'
                ? 'border-[#25D366] text-[#075E54] dark:text-[#25D366]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Videos (94 files)</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0c1317]">
          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[460px] bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              {/* Chat list */}
              <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#202c33]/50 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Simulated Chat Conversations
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {SAMPLE_CHAT_THREADS.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`w-full text-left p-3 flex items-start gap-3 hover:bg-slate-100 dark:hover:bg-[#202c33] transition-colors ${
                        selectedThreadId === thread.id ? 'bg-[#e7f8ee] dark:bg-[#202c33]' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${thread.avatarBg} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                        {thread.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">{thread.name}</h4>
                          <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">{thread.lastTime}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{thread.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages Preview */}
              <div className="md:col-span-7 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden">
                <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full ${currentThread.avatarBg} text-white flex items-center justify-center font-bold text-xs`}>
                      {currentThread.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-900 dark:text-white">{currentThread.name}</h5>
                      <p className="text-[10px] text-[#25D366]">Simulated WhatsApp Thread</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{currentThread.messages.length} messages</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {currentThread.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-xs shadow-xs ${
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
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="tabular-nums">{msg.time}</span>
                          {msg.isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  Read-only simulated archive view
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Filter simulated contacts by name or phone..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full max-w-sm px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b21] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#25D366]"
                />
                <span className="text-xs text-slate-500">Showing {filteredContacts.length} of 640 sample records</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs"
                  >
                    <div className={`w-10 h-10 rounded-full ${contact.avatarBg} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                      {contact.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">{contact.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">{contact.phone}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">"{contact.status}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                1,280 simulated photo files stored in sample partition (1.84 GB estimated).
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {SAMPLE_MEDIA.filter((m) => m.type === 'photo').concat(SAMPLE_MEDIA.filter((m) => m.type === 'photo')).map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="group bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-[#25D366] transition-colors"
                  >
                    <div className="h-32 bg-gradient-to-br from-emerald-500/10 via-slate-100 to-teal-500/10 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-3 text-center relative">
                      <ImageIcon className="w-8 h-8 text-[#075E54] dark:text-[#25D366] mb-1 opacity-70 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate max-w-full">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.size}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-[#202c33]/50 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{item.category}</span>
                      <span className="tabular-nums">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                94 simulated video files captured from demo chats and camera roll (2.12 GB estimated).
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {SAMPLE_MEDIA.filter((m) => m.type === 'video').concat(SAMPLE_MEDIA.filter((m) => m.type === 'video')).map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-4 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#075E54]/10 dark:bg-[#25D366]/10 flex items-center justify-center text-[#075E54] dark:text-[#25D366] shrink-0">
                      <Video className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate font-mono">{item.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-semibold text-[#075E54] dark:text-[#25D366] tabular-nums">{item.duration}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{item.size}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111b21] flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fictional sample datasets for demonstration purposes only.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-[#075E54] hover:bg-[#128C7E] rounded-lg transition-colors"
          >
            Done Previewing
          </button>
        </div>
      </div>
    </div>
  );
};
