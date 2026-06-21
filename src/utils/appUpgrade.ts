import { APP_VERSION } from '../config/version';
import { syncLog } from './syncLog';

const VERSION_KEY = 'golf-log-app-version';

export async function ensureLatestAppShell(): Promise<boolean> {
  if (!import.meta.env.PROD) return false;

  const previous = localStorage.getItem(VERSION_KEY);
  if (previous === APP_VERSION) return false;

  localStorage.setItem(VERSION_KEY, APP_VERSION);
  syncLog(`App upgraded ${previous ?? 'fresh install'} → v${APP_VERSION}, clearing PWA caches`);

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  window.location.reload();
  return true;
}
