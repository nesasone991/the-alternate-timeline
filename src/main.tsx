import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { reportDataIntegrity } from './lib/dataIntegrity';
import './styles/index.css';

if (import.meta.env.DEV) reportDataIntegrity();

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element in index.html.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
