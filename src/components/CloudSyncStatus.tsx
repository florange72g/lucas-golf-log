import { APP_VERSION } from '../config/version';
import { useGolf } from '../context/GolfContext';
import { getSupabaseConfigDebug } from '../lib/supabase';

function formatSyncedAt(iso: string | null): string {
  if (!iso) return 'not yet';
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function CloudSyncStatus() {
  const { syncReady, syncSource, lastSyncedAt, syncError, rounds, refreshNow } = useGolf();
  const supabaseDebug = getSupabaseConfigDebug();

  if (!syncReady) {
    return (
      <div className="rounded-xl border border-sand bg-white px-4 py-3 text-center shadow-sm">
        <p className="text-xs font-semibold text-fairway-600">Connecting to cloud…</p>
        <p className="mt-1 text-[10px] text-fairway-400">v{APP_VERSION}</p>
      </div>
    );
  }

  const cloudActive = syncSource === 'supabase' && supabaseDebug.configured;

  return (
    <div className="rounded-xl border border-sand bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-left">
          <p className="text-xs font-semibold text-fairway-700">
            {cloudActive ? '☁️ Cloud sync active' : '⚠️ Local device only'}
          </p>
          <p className="mt-0.5 text-[10px] text-fairway-400">
            v{APP_VERSION} · {rounds.length} round{rounds.length === 1 ? '' : 's'} · Last sync{' '}
            {formatSyncedAt(lastSyncedAt)}
          </p>
          {syncError && (
            <p className="mt-1 break-words text-[10px] font-medium leading-snug text-red-600">
              {syncError}
              {/player_profile|could not find the table/i.test(syncError) && (
                <span className="block text-amber-700">
                  Run the player_profile SQL in Supabase (optional — rounds still sync).
                </span>
              )}
            </p>
          )}
          {!supabaseDebug.configured && (
            <p className="mt-1 text-[10px] text-amber-700">
              Supabase env vars missing in this build.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void refreshNow()}
          className="shrink-0 rounded-lg bg-fairway-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-fairway-700"
        >
          Sync now
        </button>
      </div>
    </div>
  );
}
