export interface AdminConfig {
  linkingCode: string;
  isActive: boolean;
  updatedAt: string;
  allowConnection: boolean;
  adminEmail?: string;
  adminUsername?: string;
  adminPassword?: string;
  autoApprove?: boolean;
  codeGenerationCount?: number;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export type RealtimeSyncStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface LinkedDevice {
  isLinked: boolean;
  deviceName: string;
  deviceModel: string;
  devicePlatform: string;
  ipAddress: string;
  appVersion: string;
  linkedAt: string | null;
  batteryLevel: number;
  phoneDisplay: string;
}

export type CategoryId = 'messages' | 'contacts' | 'photos' | 'videos';

export interface BackupCategory {
  id: CategoryId;
  name: string;
  description: string;
  itemCount: number;
  sizeBytes: number;
  sizeFormatted: string;
  selected: boolean;
}

export interface BackupRecord {
  id: string;
  date: string;
  timestamp: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  categories: CategoryId[];
  status: 'Completed' | 'In Progress' | 'Cancelled' | 'Failed';
  itemSummary: {
    messages?: number;
    contacts?: number;
    photos?: number;
    videos?: number;
  };
  checksum: string;
  durationSeconds: number;
  deviceName: string;
}

export type BackupStage =
  | 'idle'
  | 'preparing'
  | 'messages'
  | 'contacts'
  | 'photos'
  | 'videos'
  | 'verifying'
  | 'completed'
  | 'cancelled';

export interface BackupSimulationState {
  stage: BackupStage;
  progress: number;
  isPaused: boolean;
  currentItemCount: number;
  totalItemCount: number;
  currentBytes: number;
  totalBytes: number;
  estimatedSecondsRemaining: number;
  statusText: string;
}

export interface SampleChatMessage {
  id: string;
  sender: string;
  isMe: boolean;
  text: string;
  time: string;
  mediaType?: 'image' | 'audio' | 'document';
  mediaName?: string;
}

export interface SampleChatThread {
  id: string;
  name: string;
  avatarBg: string;
  isGroup: boolean;
  lastMessage: string;
  lastTime: string;
  unreadCount?: number;
  messages: SampleChatMessage[];
}

export interface SampleContact {
  id: string;
  name: string;
  phone: string;
  status: string;
  avatarBg: string;
}

export interface SampleMediaItem {
  id: string;
  title: string;
  type: 'photo' | 'video';
  size: string;
  date: string;
  duration?: string;
  category: string;
}
