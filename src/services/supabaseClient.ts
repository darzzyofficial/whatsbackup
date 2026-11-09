import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { RealtimeSyncStatus } from '../types';

export interface RemoteAdminSettings {
  id: string;
  device_connection_enabled: boolean;
  linking_code?: string;
  is_active?: boolean;
  admin_username?: string;
  admin_email?: string;
  updated_at?: string;
  updated_by?: string;
}

// Production-hardened SQL Migration script for Supabase SQL Editor
export const SUPABASE_TABLE_SETUP_SQL = `-- WhatsBackup Production-Hardened Database Migration & Realtime Configuration
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query -> Run)

-- 1. Create public.admin_settings table
create table if not exists public.admin_settings (
  id text primary key default 'default',
  device_connection_enabled boolean not null default false,
  linking_code text not null default 'G5KPWFAA',
  is_active boolean not null default true,
  updated_at timestamp with time zone default now(),
  updated_by text default 'admin'
);

-- 2. Configure REPLICA IDENTITY FULL so Realtime broadcasts complete records
alter table public.admin_settings replica identity full;

-- 3. Seed default demo record if missing
insert into public.admin_settings (id, device_connection_enabled, linking_code, is_active, updated_by)
values ('default', false, 'G5KPWFAA', true, 'admin')
on conflict (id) do nothing;

-- 4. Enable Row Level Security (RLS)
alter table public.admin_settings enable row level security;

-- 5. Create secure admin verification function using app_metadata (tamper-proof)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- 6. Explicitly REVOKE ALL existing permissions from public, anon, and authenticated
revoke all on table public.admin_settings from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;

-- 7. Explicitly GRANT only the required privileges (Defense-in-Depth)
-- Public & authenticated can read the demo settings
grant select on table public.admin_settings to anon, authenticated;

-- Only authenticated users can attempt insert/update (RLS enforces is_admin)
grant insert, update on table public.admin_settings to authenticated;

-- Function execution granted only to authenticated users during RLS evaluation
grant execute on function public.is_admin() to authenticated;

-- 8. Clean up existing or legacy policies
drop policy if exists "Public visitors can read demo admin settings" on public.admin_settings;
drop policy if exists "Only authenticated admins can update demo admin settings" on public.admin_settings;
drop policy if exists "Only authenticated admins can insert demo admin settings" on public.admin_settings;
drop policy if exists "Public can read admin settings" on public.admin_settings;
drop policy if exists "Admins can update admin settings" on public.admin_settings;
drop policy if exists "Allow public read" on public.admin_settings;
drop policy if exists "Allow authenticated update" on public.admin_settings;

-- 9. RLS Policy: Anyone (anon or authenticated) can SELECT the demo settings
-- The demo linking code is intentionally public so simulator clients can view it
create policy "Public visitors can read demo admin settings"
  on public.admin_settings
  for select
  to anon, authenticated
  using (true);

-- 10. RLS Policy: ONLY users with app_metadata role = 'admin' can UPDATE
create policy "Only authenticated admins can update demo admin settings"
  on public.admin_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 11. RLS Policy: ONLY users with app_metadata role = 'admin' can INSERT
create policy "Only authenticated admins can insert demo admin settings"
  on public.admin_settings
  for insert
  to authenticated
  with check (public.is_admin());

-- 12. Add admin_settings to the Supabase Realtime publication safely
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
      and schemaname = 'public' 
      and tablename = 'admin_settings'
  ) then
    alter publication supabase_realtime add table public.admin_settings;
  end if;
end $$;
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
    // Ignore if not supported in environment
  }
}

/**
 * Resolves Supabase credentials from environment or runtime admin config.
 * Supports both modern publishable keys (sb_publishable_...) and legacy anon keys.
 */
export function getSupabaseCredentials(customUrl?: string, customAnonKey?: string): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
} {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const url = (customUrl || envUrl || '').trim();
  const anonKey = (customAnonKey || envKey || '').trim();
  const isConfigured = Boolean(
    url &&
    anonKey &&
    (url.startsWith('https://') || url.startsWith('http://'))
  );

  return { url, anonKey, isConfigured };
}

/**
 * Returns a configured Supabase client instance with session persistence enabled.
 * Returns null if credentials are not configured.
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
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
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
 * Checks for an active, valid admin session in Supabase Auth.
 * Returns the authenticated user if session is valid and has app_metadata role = 'admin'.
 */
export async function getCurrentAdminUser(customUrl?: string, customAnonKey?: string): Promise<{
  isAuthenticated: boolean;
  email?: string;
  role?: string;
  error?: string;
}> {
  const client = getSupabaseClient(customUrl, customAnonKey);
  if (!client) {
    return { isAuthenticated: false, error: 'Supabase is not configured' };
  }

  try {
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError || !session || !session.user) {
      return { isAuthenticated: false };
    }

    const role = (session.user.app_metadata?.role as string) || '';
    if (role !== 'admin') {
      return {
        isAuthenticated: false,
        email: session.user.email,
        role,
        error: 'Account does not have admin privileges. Ensure app_metadata.role is "admin".',
      };
    }

    return {
      isAuthenticated: true,
      email: session.user.email,
      role,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { isAuthenticated: false, error: msg };
  }
}

/**
 * Authenticates admin credentials using official Supabase Auth.
 * Enforces verified app_metadata role = 'admin'.
 * Uses the exact email provided without silent remapping.
 */
export async function loginAdminRemote(
  email: string,
  password: string,
  options?: { customUrl?: string; customAnonKey?: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient(options?.customUrl, options?.customAnonKey);
  if (!client) {
    return {
      success: false,
      error: 'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Email and password are required.' };
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Invalid email or password.' };
    }

    // Verify app_metadata role is 'admin'
    const role = data.user.app_metadata?.role;
    if (role !== 'admin') {
      await client.auth.signOut();
      return {
        success: false,
        error:
          'Access Denied: This account is authenticated but does not possess the "admin" role. In Supabase SQL Editor, run: update auth.users set raw_app_meta_data = raw_app_meta_data || \'{"role": "admin"}\'::jsonb where email = \'' +
          cleanEmail +
          '\'; then log in again.',
      };
    }

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Signs out the authenticated admin from Supabase Auth.
 */
export async function logoutAdminRemote(options?: {
  customUrl?: string;
  customAnonKey?: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(options?.customUrl, options?.customAnonKey);
  if (!client) {
    return { success: true };
  }

  try {
    const { error } = await client.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Updates the authenticated admin's password via Supabase Auth.
 */
export async function updateAdminPasswordRemote(
  newPassword: string,
  options?: { customUrl?: string; customAnonKey?: string }
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(options?.customUrl, options?.customAnonKey);
  if (!client) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { error } = await client.auth.updateUser({
      password: newPassword.trim(),
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Fetches the current admin settings from Supabase as the primary source of truth.
 * Returns null if Supabase is not reachable or unconfigured.
 */
export async function fetchRemoteAdminSettings(
  customUrl?: string,
  customAnonKey?: string
): Promise<RemoteAdminSettings | null> {
  const client = getSupabaseClient(customUrl, customAnonKey);
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from('admin_settings')
      .select('id, device_connection_enabled, linking_code, is_active, updated_at, updated_by')
      .eq('id', 'default')
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id || 'default',
        device_connection_enabled: Boolean(data.device_connection_enabled),
        linking_code: data.linking_code,
        is_active: data.is_active,
        updated_at: data.updated_at,
        updated_by: data.updated_by,
        admin_email: data.updated_by,
      };
    }
  } catch (err) {
    console.warn('Fetch remote admin settings from Supabase failed:', err);
  }

  return null;
}

/**
 * Saves and immediately broadcasts the updated device connection & linking code setting.
 * Uses authenticated upsert against public.admin_settings.
 * Returns verified database confirmation or error.
 */
export async function updateRemoteDeviceConnection(
  enabled: boolean,
  options?: {
    linkingCode?: string;
    isActive?: boolean;
    adminEmail?: string;
    adminUsername?: string;
    customUrl?: string;
    customAnonKey?: string;
  }
): Promise<{ success: boolean; data?: RemoteAdminSettings; error?: string }> {
  const client = getSupabaseClient(options?.customUrl, options?.customAnonKey);

  const payload = {
    id: 'default',
    device_connection_enabled: enabled,
    linking_code: options?.linkingCode || 'G5KPWFAA',
    is_active: options?.isActive ?? true,
    updated_at: new Date().toISOString(),
    updated_by: options?.adminEmail || options?.adminUsername || 'admin',
  };

  // If Supabase client is not available (local demo fallback)
  if (!client) {
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
    return { success: true, data: payload };
  }

  try {
    // 1. Perform authenticated database upsert
    const { data, error } = await client
      .from('admin_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase DB update rejected by RLS or schema constraint:', error.message);
      return { success: false, error: error.message };
    }

    // 2. Broadcast via local BroadcastChannel for same-origin tabs
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

    return { success: true, data: (data as RemoteAdminSettings) || payload };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Failed to update remote device connection:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Subscribes to Realtime updates across devices:
 * - Supabase Realtime subscriptions (postgres_changes on public.admin_settings)
 * - Window Focus & Visibility Change re-fetch (when mobile devices resume)
 * - Multi-tab BroadcastChannel for same-origin tabs
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

  const applySettings = (enabled: boolean, data?: RemoteAdminSettings) => {
    if (!isSubscribed) return;
    onUpdate(enabled, data);
  };

  // 1. Fetch latest state from Supabase immediately on mount
  const fetchLatest = async () => {
    try {
      const settings = await fetchRemoteAdminSettings(options?.customUrl, options?.customAnonKey);
      if (settings && isSubscribed) {
        applySettings(Boolean(settings.device_connection_enabled), settings);
      }
    } catch (e) {
      // Ignore
    }
  };

  fetchLatest();

  // 2. Setup window focus & visibility listeners (crucial for mobile wake-from-sleep)
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

  // 3. Fallback heartbeat polling every 4 seconds to ensure state stays in sync
  const pollInterval = setInterval(() => {
    if (!isSubscribed) return;
    fetchLatest();
  }, 4000);

  // 4. Same-browser instant BroadcastChannel listener
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

  // 5. Connect to Supabase Realtime if configured
  const client = getSupabaseClient(options?.customUrl, options?.customAnonKey);
  if (client) {
    onStatusChange('connecting');

    if (activeChannel) {
      client.removeChannel(activeChannel);
      activeChannel = null;
    }

    const channelName = 'whatsbackup_admin_settings_realtime';
    const channel = client.channel(channelName);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'admin_settings',
      },
      (payload) => {
        if (!isSubscribed) return;
        const newRecord = payload.new as any;
        if (newRecord && typeof newRecord.device_connection_enabled === 'boolean') {
          applySettings(newRecord.device_connection_enabled, {
            id: newRecord.id || 'default',
            device_connection_enabled: newRecord.device_connection_enabled,
            linking_code: newRecord.linking_code,
            is_active: newRecord.is_active,
            updated_at: newRecord.updated_at,
            updated_by: newRecord.updated_by,
          });
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
  } else {
    // If Supabase not yet configured, indicate disconnected/local mode
    onStatusChange('disconnected');
  }

  // Teardown on unmount
  return () => {
    isSubscribed = false;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    clearInterval(pollInterval);

    if (localBroadcastChannel) {
      localBroadcastChannel.removeEventListener('message', handleLocalMessage);
    }

    if (activeChannel && client) {
      client.removeChannel(activeChannel);
      activeChannel = null;
    }
  };
}
