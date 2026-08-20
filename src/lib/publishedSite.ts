import type { BrandConfig } from '../types';
import { publishedSiteContent } from '../data/site-content.generated';

declare global {
  interface Window {
    __PYRENEES_PUBLISHED_CONFIG__?: {
      brandData?: unknown;
      editorConfig?: unknown;
    } | null;
  }
}

function getBootConfig() {
  if (typeof window === 'undefined') return null;
  return window.__PYRENEES_PUBLISHED_CONFIG__ ?? null;
}

const LOCAL_PUBLISHED_KEY = 'pyrenees_published_site_snapshot_v53';

type PublishedSnapshot = {
  brandData?: unknown;
  editorConfig?: unknown;
  publishedAt?: number;
};

function getGeneratedConfig(): PublishedSnapshot {
  return publishedSiteContent as PublishedSnapshot;
}

function getLocalPublishedConfig(): PublishedSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_PUBLISHED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublishedSnapshot;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function cachePublishedSiteConfig(config: unknown): void {
  if (typeof window === 'undefined' || !config || typeof config !== 'object') return;

  try {
    window.localStorage.setItem(LOCAL_PUBLISHED_KEY, JSON.stringify(config));
  } catch (error) {
    // Le cache local est un accélérateur uniquement : une erreur de quota
    // ne doit jamais empêcher la publication ou le rendu du site.
    console.warn('Cache local de la configuration publié indisponible:', error);
  }
}

export function hasLocalPublishedSiteConfig(): boolean {
  return getLocalPublishedConfig() !== null;
}

function configPublishedAt(config: unknown): number {
  if (!config || typeof config !== 'object') return 0;
  const value = (config as { publishedAt?: unknown }).publishedAt;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function getInitialBrandData(defaultBrandData: BrandConfig): BrandConfig {
  const boot = getBootConfig();
  const generated = getGeneratedConfig();
  const local = getLocalPublishedConfig();

  const candidates = [boot, local, generated].filter(Boolean) as PublishedSnapshot[];
  const publishedConfig = candidates.reduce((best, candidate) =>
    configPublishedAt(candidate) >= configPublishedAt(best) ? candidate : best
  );

  const published =
    publishedConfig?.brandData &&
    typeof publishedConfig.brandData === 'object'
      ? publishedConfig.brandData
      : generated?.brandData;

  if (!published || typeof published !== 'object') {
    return defaultBrandData;
  }

  return {
    ...defaultBrandData,
    ...(published as Partial<BrandConfig>),
    // Les anciens fonds image locaux des assets ne sont plus des fonds de module.
    // Les fonds doivent désormais provenir de theme.sectionBackgroundImages.
    heroBgImage: '',
    theme: {
      ...(defaultBrandData.theme || {}),
      ...((published as Partial<BrandConfig>).theme || {}),
    },
  };
}

export function getInitialEditorConfig<T>(fallback: T): T {
  const boot = getBootConfig();
  const generated = getGeneratedConfig();
  const local = getLocalPublishedConfig();

  const candidates = [boot, local, generated].filter(Boolean) as PublishedSnapshot[];
  const publishedConfig = candidates.reduce((best, candidate) =>
    configPublishedAt(candidate) >= configPublishedAt(best) ? candidate : best
  );

  const published =
    publishedConfig?.editorConfig &&
    typeof publishedConfig.editorConfig === 'object'
      ? publishedConfig.editorConfig
      : generated?.editorConfig;

  return (published && typeof published === 'object'
    ? published
    : fallback) as T;
}

export function hasBootstrappedPublishedConfig(): boolean {
  return getBootConfig() !== null;
}
