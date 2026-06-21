import { registerSW } from 'virtual:pwa-register';
import { syncLog } from './utils/syncLog';

const UPDATE_INTERVAL_MS = 60 * 1000;

export function registerPwaUpdates(): void {
  if (!import.meta.env.PROD) return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      syncLog('New app version available — reloading');
      void updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };

      checkForUpdate();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
      window.addEventListener('focus', checkForUpdate);
      window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
    },
  });
}
