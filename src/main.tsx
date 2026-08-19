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

// Le contenu publié est chargé avant de révéler l'application.
// Un délai de sécurité évite qu'une API indisponible puisse laisser le site noir.
let revealed = false;
const revealSite = () => {
  if (revealed) return;
  revealed = true;
  document.documentElement.classList.remove('site-booting');
  document.documentElement.classList.add('site-ready');
};

window.addEventListener('site-bootstrap-ready', revealSite, { once: true });
window.setTimeout(revealSite, 2500);
