import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import type { PublishedRuntimeConfig } from './lib/publishedSite';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root React introuvable.');
}

async function fetchJson(url: string, timeoutMs = 4000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn(`Bootstrap impossible pour ${url}; utilisation du fallback embarqué.`, error);
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function bootstrap() {
  // React ne monte qu'après le chargement de la configuration publiée.
  // Le visiteur ne voit donc jamais le bundle ancien avant son remplacement.
  const [configResult, productsResult] = await Promise.all([
    fetchJson(`/api/site-config?ts=${Date.now()}`),
    fetchJson(`/api/products?ts=${Date.now()}`),
  ]);

  const runtimeConfig: PublishedRuntimeConfig = {};

  if (configResult?.config && typeof configResult.config === 'object') {
    runtimeConfig.brandData = configResult.config.brandData;
    runtimeConfig.editorConfig = configResult.config.editorConfig;
  }

  if (
    productsResult?.success === true &&
    Array.isArray(productsResult.products) &&
    productsResult.products.length > 0
  ) {
    runtimeConfig.products = productsResult.products;
  }

  window.__PYRENEES_BOOTSTRAP_CONFIG__ = runtimeConfig;

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  requestAnimationFrame(() => {
    document.documentElement.classList.remove('site-booting');
    document.documentElement.classList.add('site-ready');
  });
}

void bootstrap();
