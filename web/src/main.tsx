/**
 * What: Application entry point.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import './styles/app.css';
import { App } from './App';
import { I18nProvider } from './i18n/I18nProvider';

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing in index.html');
createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
