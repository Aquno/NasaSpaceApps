/**
 * What: Application entry point.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing in index.html');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
