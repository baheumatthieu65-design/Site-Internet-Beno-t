import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type PublishedConfig = {
  brandData?: unknown;
  editorConfig?: unknown;
  publishedAt?: number;
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root React introuvable.');
}

declare global {
  interface Window {
    __PYRENEES_PUBLISHED_CONFIG__?: PublishedConfig | null;
  }
}

async function loadPublishedConfigBeforeReact(): Promise<void> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch(`/api/site-config?boot=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      const config = data?.config;

      if (config && typeof config === 'object') {
        window.__PYRENEES_PUBLISHED_CONFIG__ = config;
      } else {
        window.__PYRENEES_PUBLISHED_CONFIG__ = {};
      }
    } else {
      window.__PYRENEES_PUBLISHED_CONFIG__ = {};
    }
  } catch {
    // Le serveur doit rester utilisable même si l'API est indisponible.
    // Après le timeout, App démarre avec site-content.generated.ts.
    window.__PYRENEES_PUBLISHED_CONFIG__ = {};
  } finally {
    window.clearTimeout(timeout);
  }
}

async function bootstrap() {
  await loadPublishedConfigBeforeReact();

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // index.html masque #root pendant le bootstrap. On ne le révèle
  // qu'après le premier rendu React, afin d'éviter le flash du bundle
  // avant l'arrivée de la configuration serveur.
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('site-booting');
    document.documentElement.classList.add('site-ready');
  });
}

void bootstrap();
