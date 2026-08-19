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

function getGeneratedConfig() {
  return publishedSiteContent as {
    brandData?: unknown;
    editorConfig?: unknown;
    publishedAt?: number;
  };
}

function configPublishedAt(config: unknown): number {
  if (!config || typeof config !== 'object') return 0;
  const value = (config as { publishedAt?: unknown }).publishedAt;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function getInitialBrandData(defaultBrandData: BrandConfig): BrandConfig {
  const boot = getBootConfig();
  const generated = getGeneratedConfig();
  const bootIsNewer =
    configPublishedAt(boot) >= configPublishedAt(generated);

  const published =
    bootIsNewer &&
    boot?.brandData &&
    typeof boot.brandData === 'object'
      ? boot.brandData
      : generated?.brandData;

  if (!published || typeof published !== 'object') {
    return defaultBrandData;
  }

  return {
    ...defaultBrandData,
    ...(published as Partial<BrandConfig>),
    theme: {
      ...(defaultBrandData.theme || {}),
      ...((published as Partial<BrandConfig>).theme || {}),
    },
  };
}

export function getInitialEditorConfig<T>(fallback: T): T {
  const boot = getBootConfig();
  const generated = getGeneratedConfig();
  const bootIsNewer =
    configPublishedAt(boot) >= configPublishedAt(generated);

  const published =
    bootIsNewer &&
    boot?.editorConfig &&
    typeof boot.editorConfig === 'object'
      ? boot.editorConfig
      : generated?.editorConfig;

  return (published && typeof published === 'object'
    ? published
    : fallback) as T;
}

export function hasBootstrappedPublishedConfig(): boolean {
  return getBootConfig() !== null;
}
