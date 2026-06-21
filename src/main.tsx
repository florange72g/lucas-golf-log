import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { APP_VERSION } from './config/version';
import { GolfProvider } from './context/GolfContext';
import { logSupabaseStatus } from './lib/supabase';
import { registerPwaUpdates } from './registerPwa';
import { ensureLatestAppShell } from './utils/appUpgrade';
import { syncLog } from './utils/syncLog';
import App from './App';
import './index.css';

async function startApp(): Promise<void> {
  const reloading = await ensureLatestAppShell();
  if (reloading) return;

  registerPwaUpdates();
  syncLog(`Lucas Golf Log v${APP_VERSION} starting`);
  logSupabaseStatus();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <GolfProvider>
          <App />
        </GolfProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}

void startApp();
