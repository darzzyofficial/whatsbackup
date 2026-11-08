import { BackupRecord } from '../types';
import { SAMPLE_CHAT_THREADS, SAMPLE_CONTACTS, SAMPLE_MEDIA } from '../data/sampleData';

export function generateReportText(record: BackupRecord): string {
  const timestamp = new Date(record.timestamp).toUTCString();
  const divider = '='.repeat(72);
  const subDivider = '-'.repeat(72);

  let output = `
${divider}
                       WHATSBACKUP DATA REPORT
${divider}

------------------------------------------------------------------------
1. BACKUP SUMMARY
------------------------------------------------------------------------
Backup Archive ID  : ${record.id}
Generated Date     : ${record.date} (${timestamp})
Target Device      : Android Phone
Backup Status      : ${record.status.toUpperCase()}
Integrity Checksum : ${record.checksum}

------------------------------------------------------------------------
2. INCLUDED CATEGORIES
------------------------------------------------------------------------
${record.categories.map((cat) => ` [x] ${cat.toUpperCase()}`).join('\n')}

------------------------------------------------------------------------
3. SAMPLE CHAT ARCHIVES (SIMULATED CONVERSATIONS)
------------------------------------------------------------------------
${SAMPLE_CHAT_THREADS.map((thread) => {
  return `
Conversation: ${thread.name} [${thread.isGroup ? 'Group' : 'Direct Message'}]
Total Messages Cached: ${thread.messages.length}
Recent Snippets:
${thread.messages.map((m) => `  [${m.time}] ${m.sender}: ${m.text}`).join('\n')}
`;
}).join('\n')}

------------------------------------------------------------------------
4. CONTACT DIRECTORY SAMPLE (TOTAL: ${record.itemSummary.contacts || 320} RECORDS)
------------------------------------------------------------------------
${SAMPLE_CONTACTS.slice(0, 10).map((c, i) => {
  return `  ${String(i + 1).padStart(2, '0')}. ${c.name.padEnd(26)} | ${c.phone.padEnd(20)} | Status: "${c.status}"`;
}).join('\n')}
  ... and ${(record.itemSummary.contacts || 320) - 10} additional fictional contacts.

------------------------------------------------------------------------
5. MEDIA ASSETS SAMPLE (TOTAL: ${(record.itemSummary.photos || 480) + (record.itemSummary.videos || 35)} FILES)
------------------------------------------------------------------------
${SAMPLE_MEDIA.map((m, i) => {
  const duration = m.duration ? ` [${m.duration}]` : '';
  return `  ${String(i + 1).padStart(2, '0')}. ${m.title.padEnd(34)} | ${m.type.toUpperCase().padEnd(6)}${duration.padEnd(8)} | ${m.size.padEnd(9)} | Category: ${m.category}`;
}).join('\n')}

${subDivider}
SECURITY & VERIFICATION AUDIT TRAIL:
- Local sandbox verification: PASSED
- Payload serialization: gzip/compressed tarball (Simulated)
- Verification signature: 0x8F9A2B4C9D2E1093B574
${divider}
END OF WHATSBACKUP SIMULATION REPORT
`;

  return output.trim();
}

export function downloadReportFile(record: BackupRecord): void {
  const textContent = generateReportText(record);
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `WhatsBackup_Report_${record.id}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
