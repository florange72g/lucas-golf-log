import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GolfProvider } from './context/GolfContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GolfProvider>
        <App />
      </GolfProvider>
    </BrowserRouter>
  </StrictMode>
);
