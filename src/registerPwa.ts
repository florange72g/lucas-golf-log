import { registerSW } from 'virtual:pwa-register';

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

export function registerPwaUpdates(): void {
  if (!import.meta.env.PROD) return;

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });

      window.addEventListener('focus', checkForUpdate);
      window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
    },
  });
}
