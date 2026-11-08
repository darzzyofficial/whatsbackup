import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { RealtimeSyncStatus } from '../types';

export interface RemoteAdminSettings {
  id: string;
  device_connection_enabled: boolean;
  linking_code?: string;
  is_active?: boolean;
  admin_username?: string;
  admin_password?: string;
  updated_at?: string;
  updated_by?: string;
}

// SQL Migration script for Supabase SQL Editor
export const SUPABASE_TABLE_SETUP_SQL = `-- WhatsBackup Admin Settings Table with Realtime Enabled
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query -> Run)

-- 1. Create admin_settings table
create table if not exists public.admin_settings (
  id text primary key default 'default',
  device_connection_enabled boolean not null default false,
  linking_code text not null default 'G5KPWFAA',
  is_active boolean not null default true,
  updated_at timestamp with time zone default now(),
  updated_by text default 'admin'
);

-- 2. Seed default row
insert into public.admin_settings (id, device_connection_enabled, linking_code, is_active, updated_by)
values ('default', false, 'G5KPWFAA', true, 'admin')
on conflict (id) do nothing;

-- 3. Enable Row Level Security (RLS)
alter table public.admin_settings enable row level security;

-- 4. Allow public read access to admin settings
drop policy if exists "Public can read admin settings" on public.admin_settings;
create policy "Public can read admin settings"
  on public.admin_settings for select
  using (true);

-- 5. Allow anonymous/admin updates to admin settings
drop policy if exists "Admins can update admin settings" on public.admin_settings;
create policy "Admins can update admin settings"
  on public.admin_settings for all
  using (true)
  with check (true);

-- 6. Add table to Supabase Realtime publication
alter publication supabase_realtime add table public.admin_settings;
`;

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';
let activeChannel: RealtimeChannel | null = null;
let localBroadcastChannel: BroadcastChannel | null = null;

// Multi-tab broadcast channel for instant local reactivity
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBroadcastChannel = new BroadcastChannel('whatsbackup_realtime_sync');
  } catch (e) {
    // Ignore
  }
}

/**
 * Resolves Supabase credentials from environment or runtime admin config
 */
export function getSupabaseCredentials(customUrl?: string, customAnonKey?: string): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const url = (customUrl || envUrl || '').trim();
  const anonKey = (customAnonKey || envKey || '').trim();
  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));

  return { url, anonKey, isConfigured };
}

/**
 * Returns a configured Supabase client instance (or null if not yet configured)
 */
export function getSupabaseClient(customUrl?: string, customAnonKey?: string): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials(customUrl, customAnonKey);
  if (!isConfigured) {
    return null;
  }

  const clientKey = `${url}:${anonKey}`;
  if (cachedClient && currentClientKey === clientKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentClientKey = clientKey;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Authenticates admin credentials against backend server
 */
export async function loginAdminRemote(
  username: string,
  password: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ username, password }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, data: json.data };
      }
      return { success: false, error: json.error || 'Invalid credentials' };
    }
    return { success: false, error: 'Server unavailable' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Fetches the current admin setting from server backend or Supabase
 */
export async function fetchRemoteAdminSettings(
  customUrl?: string,
  customAnonKey?: string
): Promise<RemoteAdminSettings | null> {
  // 1. Try our fullstack server API first (with cache-busting for mobile browsers)
  try {
    const res = await fetch(`/api/admin/settings?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            id: 'default',
            device_connection_enabled: Boolean(json.data.allowConnection),
            linking_code: json.data.linkingCode,
            is_active: json.data.isActive,
            admin_username: json.data.adminUsername,
            admin_password: json.data.adminPassword,
            updated_at: json.data.updatedAt,
            updated_by: json.data.adminUsername,
          };
        }
      }
    }
  } catch (e) {
    // API not reachable or static host
  }

  // 2. Try Supabase if configured
  const client = getSupabaseClient(customUrl, customAnonKey);
  if (client) {
    try {
      const { data, error } = await client
        .from('admin_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        return data as RemoteAdminSettings;
      }
    } catch (err) {
      console.warn('Fetch remote admin settings from Supabase failed:', err);
    }
  }

  return null;
}

/**
 * Saves and immediately broadcasts the updated device connection & linking code setting
 * across all devices (Desktop, Mobile, Tablets) via Server API + SSE + Supabase + BroadcastChannel
 */
export async function updateRemoteDeviceConnection(
  enabled: boolean,
  options?: {
    linkingCode?: string;
    isActive?: boolean;
    adminUsername?: string;
    adminPassword?: string;
    customUrl?: string;
    customAnonKey?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const payload: RemoteAdminSettings = {
    id: 'default',
    device_connection_enabled: enabled,
    linking_code: options?.linkingCode || 'G5KPWFAA',
    is_active: options?.isActive ?? true,
    updated_at: new Date().toISOString(),
    updated_by: options?.adminUsername || 'admin',
  };

  // 1. Send immediately to our server backend (Persists to disk & pushes to mobile via SSE)
  try {
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        allowConnection: enabled,
        linkingCode: options?.linkingCode,
        isActive: options?.isActive,
        adminUsername: options?.adminUsername,
        adminPassword: options?.adminPassword,
      }),
    });
  } catch (e) {
    // Fallback if running purely static
  }

  // 2. Send immediately to local BroadcastChannel (instant multi-tab synchronization)
  if (localBroadcastChannel) {
    try {
      localBroadcastChannel.postMessage({
        type: 'device_connection_change',
        payload,
      });
    } catch (e) {
      // Ignore
    }
  }

  // 3. Send via window StorageEvent fallback
  try {
    localStorage.setItem(
      'whatsbackup_realtime_event',
      JSON.stringify({ timestamp: Date.now(), ...payload })
    );
  } catch (e) {
    // Ignore
  }

  // 4. Send to Supabase (Database + Realtime broadcast) if configured
  const client = getSupabaseClient(options?.customUrl, options?.customAnonKey);
  if (!client) {
    return { success: true };
  }

  try {
    if (activeChannel) {
      activeChannel.send({
        type: 'broadcast',
        event: 'device_connection_change',
        payload,
      }).catch((e) => console.warn('Supabase broadcast failed:', e));
    }

    const { error } = await client
      .from('admin_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase DB upsert error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Failed to update remote device connection:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Subscribes to Realtime updates across devices:
 * - Server-Sent Events (SSE) from /api/admin/events (Desktop <-> Mobile)
 * - Periodic background sync & on-focus sync (when mobile tab resumes)
 * - Supabase Realtime subscriptions (postgres_changes + broadcast)
 * - BroadcastChannel & window storage for multi-tab
 */
export function subscribeToDeviceConnectionRealtime(
  onUpdate: (enabled: boolean, data?: RemoteAdminSettings) => void,
  onStatusChange: (status: RealtimeSyncStatus) => void,
  options?: {
    customUrl?: string;
    customAnonKey?: string;
  }
): () => void {
  let isSubscribed = true;

  // Helper to apply updates safely
  const applySettings = (enabled: boolean, data?: RemoteAdminSettings) => {
    if (!isSubscribed) return;
    onUpdate(enabled, data);
  };

  // 1. Initial fetch from server to get latest code & settings immediately on mobile / desktop
  const fetchLatest = async () => {
    try {
      const res = await fetch(`/api/admin/settings?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && json.data) {
            applySettings(Boolean(json.data.allowConnection), {
              id: 'default',
              device_connection_enabled: Boolean(json.data.allowConnection),
              linking_code: json.data.linkingCode,
              is_active: json.data.isActive,
              admin_username: json.data.adminUsername,
              admin_password: json.data.adminPassword,
              updated_at: json.data.updatedAt,
              updated_by: json.data.adminUsername,
            });
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  };

  fetchLatest();

  // 2. Setup Server-Sent Events (SSE) connection to backend server
  let eventSource: EventSource | null = null;
  let sseReconnectTimer: any = null;

  const connectSSE = () => {
    if (!isSubscribed) return;
    try {
      if (eventSource) {
        eventSource.close();
      }
      eventSource = new EventSource('/api/admin/events');

      eventSource.onopen = () => {
        if (!isSubscribed) return;
        onStatusChange('connected');
      };

      eventSource.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.data) {
            applySettings(Boolean(parsed.data.allowConnection), {
              id: 'default',
              device_connection_enabled: Boolean(parsed.data.allowConnection),
              linking_code: parsed.data.linkingCode,
              is_active: parsed.data.isActive,
              admin_username: parsed.data.adminUsername,
              admin_password: parsed.data.adminPassword,
              updated_at: parsed.data.updatedAt,
              updated_by: parsed.data.adminUsername,
            });
          }
        } catch (e) {
          // Ignore parse error
        }
      };

      eventSource.onerror = () => {
        if (!isSubscribed) return;
        onStatusChange('reconnecting');
        // Proactively try to re-establish SSE on mobile if dropped
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        clearTimeout(sseReconnectTimer);
        sseReconnectTimer = setTimeout(() => {
          if (isSubscribed) {
            connectSSE();
          }
        }, 3000);
      };
    } catch (e) {
      // Fallback to polling
    }
  };

  connectSSE();

  // 3. Heartbeat Polling & Window Focus / Visibility Change
  // Essential for mobile devices when returning from lock screen or background tab
  const handleVisibilityChange = () => {
    if (!isSubscribed) return;
    if (document.visibilityState === 'visible') {
      fetchLatest();
    }
  };
  const handleFocus = () => {
    if (!isSubscribed) return;
    fetchLatest();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);

  // Periodic polling every 3 seconds as a safety net across all devices
  const pollInterval = setInterval(() => {
    if (!isSubscribed) return;
    fetchLatest();
  }, 3000);

  // 4. Local BroadcastChannel for instant same-browser tabs
  const handleLocalMessage = (event: MessageEvent) => {
    if (!isSubscribed) return;
    if (event.data?.type === 'device_connection_change' && event.data?.payload) {
      const payload = event.data.payload as RemoteAdminSettings;
      applySettings(Boolean(payload.device_connection_enabled), payload);
    }
  };

  if (localBroadcastChannel) {
    localBroadcastChannel.addEventListener('message', handleLocalMessage);
  }

  // 5. Cross-tab storage event
  const handleStorageEvent = (e: StorageEvent) => {
    if (!isSubscribed) return;
    if (e.key === 'whatsbackup_realtime_event' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (typeof parsed.device_connection_enabled === 'boolean') {
          applySettings(parsed.device_connection_enabled, parsed);
        }
      } catch (err) {
        // Ignore
      }
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // 6. Supabase Realtime integration (if credentials supplied)
  const client = getSupabaseClient(options?.customUrl, options?.customAnonKey);
  if (client) {
    // Initial fetch from Supabase
    (async () => {
      try {
        const { data, error } = await client
          .from('admin_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (!isSubscribed) return;
        if (!error && data) {
          const settings = data as RemoteAdminSettings;
          applySettings(Boolean(settings.device_connection_enabled), settings);
        }
      } catch (err: unknown) {
        console.warn('Initial fetch from Supabase failed:', err);
      }
    })();

    const channelName = 'whatsbackup_admin_settings_realtime';
    if (activeChannel) {
      client.removeChannel(activeChannel);
      activeChannel = null;
    }

    const channel = client.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'admin_settings',
      },
      (payload) => {
        if (!isSubscribed) return;
        const newRecord = payload.new as RemoteAdminSettings;
        if (newRecord && typeof newRecord.device_connection_enabled === 'boolean') {
          applySettings(newRecord.device_connection_enabled, newRecord);
        }
      }
    );

    channel.on(
      'broadcast',
      { event: 'device_connection_change' },
      (payload) => {
        if (!isSubscribed) return;
        const data = payload.payload as RemoteAdminSettings;
        if (data && typeof data.device_connection_enabled === 'boolean') {
          applySettings(data.device_connection_enabled, data);
        }
      }
    );

    channel.subscribe((status) => {
      if (!isSubscribed) return;
      if (status === 'SUBSCRIBED') {
        onStatusChange('connected');
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        onStatusChange('reconnecting');
      } else if (status === 'CLOSED') {
        onStatusChange('disconnected');
      }
    });

    activeChannel = channel;
  }

  // Cleanup on unmount
  return () => {
    isSubscribed = false;
    clearTimeout(sseReconnectTimer);
    if (eventSource) {
      eventSource.close();
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    clearInterval(pollInterval);

    if (localBroadcastChannel) {
      localBroadcastChannel.removeEventListener('message', handleLocalMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);

    if (activeChannel && client) {
      client.removeChannel(activeChannel);
      activeChannel = null;
    }
  };
}
