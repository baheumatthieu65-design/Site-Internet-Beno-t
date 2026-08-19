import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import GitePage from './components/GitePage';
import './index.css';
import './styles/gite-v46.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root React introuvable.');

const isGite = window.location.pathname.replace(/\/+$/, '') === '/gite';

createRoot(rootElement).render(
  <StrictMode>{isGite ? <GitePage /> : <App />}</StrictMode>,
);

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('site-booting');
    document.documentElement.classList.add('site-ready');
  });
});
