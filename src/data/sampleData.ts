import { BackupRecord, SampleChatThread, SampleContact, SampleMediaItem, AdminConfig, LinkedDevice } from '../types';

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  linkingCode: 'G5KPWFAA',
  isActive: true,
  updatedAt: new Date().toISOString(),
  allowConnection: false,
  adminUsername: 'admin',
  adminPassword: 'admin',
  autoApprove: false,
  codeGenerationCount: 1,
};

export const DEFAULT_LINKED_DEVICE: LinkedDevice = {
  isLinked: false,
  deviceName: 'Android Phone',
  deviceModel: 'Android',
  devicePlatform: 'Android',
  ipAddress: '192.168.1.1',
  appVersion: 'WhatsApp',
  linkedAt: null,
  batteryLevel: 95,
  phoneDisplay: '',
};

export const INITIAL_BACKUP_CATEGORIES = [
  {
    id: 'messages' as const,
    name: 'Messages',
    description: 'Chats, group conversations & voice notes',
    itemCount: 1150,
    sizeBytes: 50541363, // ~48.2 MB
    sizeFormatted: '48.2 MB',
    selected: true,
  },
  {
    id: 'contacts' as const,
    name: 'Contacts',
    description: 'Phone numbers & address book',
    itemCount: 320,
    sizeBytes: 2621440, // ~2.5 MB
    sizeFormatted: '2.5 MB',
    selected: true,
  },
  {
    id: 'photos' as const,
    name: 'Photos',
    description: 'Camera pictures & shared photos',
    itemCount: 480,
    sizeBytes: 194000000, // ~185 MB
    sizeFormatted: '185.0 MB',
    selected: true,
  },
  {
    id: 'videos' as const,
    name: 'Videos',
    description: 'Video messages & recorded clips',
    itemCount: 35,
    sizeBytes: 125829120, // ~120 MB
    sizeFormatted: '120.0 MB',
    selected: true,
  },
];

export const INITIAL_BACKUP_HISTORY: BackupRecord[] = [
  {
    id: 'WB-2026-8842-X7',
    date: 'Yesterday at 09:42 AM',
    timestamp: Date.now() - 86400000,
    totalSizeBytes: 372991923,
    totalSizeFormatted: '355.7 MB',
    categories: ['messages', 'contacts', 'photos', 'videos'],
    status: 'Completed',
    itemSummary: {
      messages: 1150,
      contacts: 320,
      photos: 480,
      videos: 35,
    },
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    durationSeconds: 18,
    deviceName: 'Android Phone',
  },
  {
    id: 'WB-2026-7719-B2',
    date: 'Nov 02, 2026 at 04:15 PM',
    timestamp: Date.now() - 518400000,
    totalSizeBytes: 53162803,
    totalSizeFormatted: '50.7 MB',
    categories: ['messages', 'contacts'],
    status: 'Completed',
    itemSummary: {
      messages: 1120,
      contacts: 318,
    },
    checksum: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    durationSeconds: 8,
    deviceName: 'Android Phone',
  },
];

export const SAMPLE_CHAT_THREADS: SampleChatThread[] = [
  {
    id: 'thread-1',
    name: 'Family Hub 🏡',
    avatarBg: 'bg-emerald-600',
    isGroup: true,
    lastMessage: 'Mom: See everyone at 6:30 for dinner! ❤️',
    lastTime: '10:45 AM',
    messages: [
      { id: 'm1', sender: 'Dad', isMe: false, text: 'Is everyone coming over for Sunday roast this weekend?', time: '09:12 AM' },
      { id: 'm2', sender: 'Me', isMe: true, text: 'Yes, looking forward to it! Bringing the apple crumble.', time: '09:30 AM' },
      { id: 'm3', sender: 'Sister Sarah', isMe: false, text: 'Count me in! I will bring fresh sourdough.', time: '10:15 AM' },
      { id: 'm4', sender: 'Mom', isMe: false, text: 'See everyone at 6:30 for dinner! ❤️', time: '10:45 AM' },
    ],
  },
  {
    id: 'thread-2',
    name: 'Engineering Sprint Team ⚡',
    avatarBg: 'bg-sky-600',
    isGroup: true,
    lastMessage: 'Marcus: Production deployment checklist passed.',
    lastTime: '09:20 AM',
    messages: [
      { id: 'e1', sender: 'Elena', isMe: false, text: 'Backend endpoints for backup sync are merged.', time: 'Yesterday' },
      { id: 'e2', sender: 'Me', isMe: true, text: 'Great work Elena! Client verification tests run cleanly.', time: 'Yesterday' },
      { id: 'e3', sender: 'Marcus', isMe: false, text: 'Production deployment checklist passed.', time: '09:20 AM' },
    ],
  },
  {
    id: 'thread-3',
    name: 'Sarah Jenkins',
    avatarBg: 'bg-purple-600',
    isGroup: false,
    lastMessage: 'Thanks for the quick design feedback!',
    lastTime: 'Yesterday',
    messages: [
      { id: 's1', sender: 'Sarah', isMe: false, text: 'Hey Alex, did you review the mockups for the new export modal?', time: 'Yesterday 2:10 PM' },
      { id: 's2', sender: 'Me', isMe: true, text: 'Just left comments on Figma. The clean layout looks fantastic!', time: 'Yesterday 2:45 PM' },
      { id: 's3', sender: 'Sarah', isMe: false, text: 'Thanks for the quick design feedback!', time: 'Yesterday 3:00 PM' },
    ],
  },
  {
    id: 'thread-4',
    name: 'Weekend Hikers 🥾',
    avatarBg: 'bg-amber-600',
    isGroup: true,
    lastMessage: 'David: Pack waterproof boots, light drizzle expected.',
    lastTime: 'Friday',
    messages: [
      { id: 'h1', sender: 'Chloe', isMe: false, text: 'Meeting spot confirmed at Ridge Trailhead 8 AM.', time: 'Friday 4:00 PM' },
      { id: 'h2', sender: 'David', isMe: false, text: 'Pack waterproof boots, light drizzle expected.', time: 'Friday 5:12 PM' },
    ],
  },
  {
    id: 'thread-5',
    name: 'Dr. Aisha Patel',
    avatarBg: 'bg-teal-600',
    isGroup: false,
    lastMessage: 'Your annual health checkup is confirmed for the 18th.',
    lastTime: 'Thursday',
    messages: [
      { id: 'd1', sender: 'Dr. Aisha', isMe: false, text: 'Hello Alex, following up on your clinic appointment schedule.', time: 'Thursday 11:00 AM' },
      { id: 'd2', sender: 'Me', isMe: true, text: 'Morning Dr. Patel, Wednesday afternoon works great.', time: 'Thursday 11:24 AM' },
      { id: 'd3', sender: 'Dr. Aisha', isMe: false, text: 'Your annual health checkup is confirmed for the 18th.', time: 'Thursday 11:35 AM' },
    ],
  },
];

export const SAMPLE_CONTACTS: SampleContact[] = [
  { id: 'c1', name: 'Alex Carter (Self)', phone: '+1 (555) 019-2834', status: 'Hey there! Using WhatsBackup Demo', avatarBg: 'bg-emerald-600' },
  { id: 'c2', name: 'Sarah Jenkins', phone: '+1 (555) 438-9012', status: 'At work · Design Systems', avatarBg: 'bg-purple-600' },
  { id: 'c3', name: 'Marcus Vance', phone: '+1 (555) 891-2304', status: 'Available', avatarBg: 'bg-sky-600' },
  { id: 'c4', name: 'Elena Rostova', phone: '+1 (555) 327-6549', status: 'Coding mode on 💻', avatarBg: 'bg-indigo-600' },
  { id: 'c5', name: 'Mom (Martha Carter)', phone: '+1 (555) 762-9841', status: 'Gardening & baking', avatarBg: 'bg-rose-600' },
  { id: 'c6', name: 'Dad (Robert Carter)', phone: '+1 (555) 762-9842', status: 'Busy in workshop', avatarBg: 'bg-blue-600' },
  { id: 'c7', name: 'Dr. Aisha Patel', phone: '+1 (555) 603-1289', status: 'Urgent matters only', avatarBg: 'bg-teal-600' },
  { id: 'c8', name: 'David Kim', phone: '+1 (555) 914-5532', status: 'Hiking trails & summiting', avatarBg: 'bg-amber-600' },
  { id: 'c9', name: 'Chloe Dubois', phone: '+1 (555) 238-7740', status: 'Photography & travel 📷', avatarBg: 'bg-orange-600' },
  { id: 'c10', name: 'Lucas Silva', phone: '+1 (555) 551-8890', status: 'In a meeting', avatarBg: 'bg-lime-600' },
  { id: 'c11', name: 'Jessica Taylor', phone: '+1 (555) 440-3321', status: 'Battery about to die', avatarBg: 'bg-pink-600' },
  { id: 'c12', name: 'Oliver Wang', phone: '+1 (555) 880-9912', status: 'Sleep mode', avatarBg: 'bg-cyan-600' },
];

export const SAMPLE_MEDIA: SampleMediaItem[] = [
  { id: 'med-1', title: 'family_reunion_cabin.jpg', type: 'photo', size: '3.4 MB', date: 'Yesterday', category: 'Camera Roll' },
  { id: 'med-2', title: 'architecture_blueprint_v4.png', type: 'photo', size: '1.8 MB', date: 'Oct 29', category: 'Documents' },
  { id: 'med-3', title: 'mountain_summit_panorama.jpg', type: 'photo', size: '5.2 MB', date: 'Oct 24', category: 'Hiking' },
  { id: 'med-4', title: 'birthday_celebration_clip.mp4', type: 'video', size: '48.6 MB', duration: '0:45', date: 'Oct 20', category: 'Videos' },
  { id: 'med-5', title: 'sprint_demo_walkthrough.mp4', type: 'video', size: '112.4 MB', duration: '3:12', date: 'Oct 15', category: 'Work' },
  { id: 'med-6', title: 'dog_playing_in_park.mp4', type: 'video', size: '34.1 MB', duration: '0:28', date: 'Oct 10', category: 'Videos' },
  { id: 'med-7', title: 'coffee_art_espresso.jpg', type: 'photo', size: '2.1 MB', date: 'Oct 05', category: 'Camera Roll' },
  { id: 'med-8', title: 'sunset_over_harbor.jpg', type: 'photo', size: '4.8 MB', date: 'Sep 28', category: 'Camera Roll' },
];
