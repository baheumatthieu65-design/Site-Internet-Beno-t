import type { BrandConfig } from '../types';
import { publishedSiteContent } from '../data/site-content.generated';

export interface PublishedRuntimeConfig {
  brandData?: Partial<BrandConfig>;
  editorConfig?: unknown;
  products?: unknown[];
}

declare global {
  interface Window {
    __PYRENEES_BOOTSTRAP_CONFIG__?: PublishedRuntimeConfig;
  }
}

export function getBootstrapConfig(): PublishedRuntimeConfig | null {
  if (typeof window === 'undefined') return null;
  return window.__PYRENEES_BOOTSTRAP_CONFIG__ || null;
}

export function getInitialBrandData(
  defaultBrandData: BrandConfig,
  runtimeBrandData?: Partial<BrandConfig> | null,
): BrandConfig {
  const published = runtimeBrandData || publishedSiteContent?.brandData;

  if (!published || typeof published !== 'object') {
    return defaultBrandData;
  }

  return {
    ...defaultBrandData,
    ...published,
    theme: {
      ...(defaultBrandData.theme || {}),
      ...(published as any).theme,
    },
  };
}

export function getInitialEditorConfig<T>(
  fallback: T,
  runtimeEditorConfig?: unknown,
): T {
  const published =
    runtimeEditorConfig && typeof runtimeEditorConfig === 'object'
      ? runtimeEditorConfig
      : publishedSiteContent?.editorConfig;
  return (published && typeof published === 'object'
    ? published
    : fallback) as T;
}
