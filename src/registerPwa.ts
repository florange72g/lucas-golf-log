import { registerSW } from 'virtual:pwa-register';
import { syncLog } from './utils/syncLog';

const UPDATE_INTERVAL_MS = 30 * 1000;

function activateWaitingWorker(registration: ServiceWorkerRegistration): void {
  if (registration.waiting) {
    syncLog('Activating waiting service worker');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

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

      activateWaitingWorker(registration);

      const checkForUpdate = () => {
        registration.update().then(() => activateWaitingWorker(registration)).catch(() => {});
      };

      checkForUpdate();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
      window.addEventListener('focus', checkForUpdate);
      window.addEventListener('pageshow', checkForUpdate);
      window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
    },
  });
}
