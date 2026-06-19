import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Inter variable font, bundled (offline-friendly for Tauri — no CDN).
import '@fontsource-variable/inter/index.css';
// Register the <math-field> custom element BEFORE any block mounts.
import '@/editor/mathliveSetup';
// KaTeX styles for STATIC result rendering (Computer Modern fonts).
import 'katex/dist/katex.min.css';
import '@/styles/index.css';
import App from '@/App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
