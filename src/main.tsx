import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root React introuvable.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Retire le voile uniquement après que React a eu l'occasion de monter.
// Cela ne dépend d'aucune API et ne peut donc pas provoquer de chargement
// infini.
requestAnimationFrame(() => {
  document.documentElement.classList.remove('site-preloading');

  const loader = document.getElementById('site-first-paint-loader');

  if (loader) {
    window.setTimeout(() => loader.remove(), 140);
  }
});
