import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { syncLog, syncWarn } from '../utils/syncLog';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

let client: SupabaseClient | null = null;
let statusLogged = false;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl?.trim() && supabaseAnonKey?.trim());
}

export function getSupabaseConfigDebug(): {
  configured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
} {
  return {
    configured: isSupabaseConfigured(),
    hasUrl: Boolean(supabaseUrl?.trim()),
    hasKey: Boolean(supabaseAnonKey?.trim()),
  };
}

export function logSupabaseStatus(): void {
  if (statusLogged) return;
  statusLogged = true;

  const debug = getSupabaseConfigDebug();
  if (debug.configured) {
    syncLog('Supabase configured — cloud is source of truth', {
      url: supabaseUrl!.replace(/^(https:\/\/[^.]+).*/, '$1…'),
    });
    return;
  }

  syncWarn('Supabase NOT configured — rounds/courses use localStorage cache only', {
    hasUrl: debug.hasUrl,
    hasKey: debug.hasKey,
    hint: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (local) and Vercel env vars, then rebuild.',
  });
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}
