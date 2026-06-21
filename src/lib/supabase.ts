import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { syncLog, syncWarn } from '../utils/syncLog';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export function normalizeSupabaseUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;

  let url = raw.trim().replace(/^['"]|['"]$/g, '');

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/i, '');

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('.supabase.co')) return null;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

let client: SupabaseClient | null = null;
let statusLogged = false;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey?.trim());
}

export function getSupabaseConfigDebug(): {
  configured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  urlValid: boolean;
  urlHint: string | null;
} {
  const hasUrl = Boolean(rawSupabaseUrl?.trim());
  const hasKey = Boolean(supabaseAnonKey?.trim());
  const urlValid = Boolean(supabaseUrl);

  let urlHint: string | null = null;
  if (hasUrl && !urlValid) {
    urlHint =
      'VITE_SUPABASE_URL must be https://YOUR-PROJECT.supabase.co (no trailing slash, no /rest/v1).';
  }

  return {
    configured: isSupabaseConfigured(),
    hasUrl,
    hasKey,
    urlValid,
    urlHint,
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

  if (debug.hasUrl && !debug.urlValid) {
    syncWarn('Supabase URL is invalid — check VITE_SUPABASE_URL in Vercel', {
      raw: rawSupabaseUrl?.replace(/^(https:\/\/[^.]+).*/, '$1…'),
      hint: debug.urlHint,
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
