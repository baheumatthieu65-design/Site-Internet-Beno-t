import type { BrandConfig } from '../types';
import { publishedSiteContent } from '../data/site-content.generated';

export function getInitialBrandData(defaultBrandData: BrandConfig): BrandConfig {
  const published = publishedSiteContent?.brandData;

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

export function getInitialEditorConfig<T>(fallback: T): T {
  const published = publishedSiteContent?.editorConfig;
  return (published && typeof published === 'object'
    ? published
    : fallback) as T;
}

/**
 * Version embarquée dans le bundle Vercel.
 * Les anciens bundles ne possèdent pas encore cette valeur et utilisent 0.
 */
export function getInitialPublishedRevision(): number {
  const value = Number(
    (publishedSiteContent as any)?.publishedRevision ?? 0
  );

  return Number.isFinite(value) ? value : 0;
}
