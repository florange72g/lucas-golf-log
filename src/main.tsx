import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GolfProvider } from './context/GolfContext';
import { logSupabaseStatus } from './lib/supabase';
import { registerPwaUpdates } from './registerPwa';
import App from './App';
import './index.css';

registerPwaUpdates();
logSupabaseStatus();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GolfProvider>
        <App />
      </GolfProvider>
    </BrowserRouter>
  </StrictMode>
);
