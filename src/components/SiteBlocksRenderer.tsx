import React, { useEffect } from 'react';
import type { EditorBlock, SiteEditorConfig } from './SiteVisualEditor';
import { publishedSiteContent } from '../data/site-content.generated';

/**
 * V4.1 — publication bridge resilient to React/admin DOM differences.
 *
 * A visual-editor block can outlive the DOM that created its selector. The
 * admin panel changes wrappers and therefore old nth-of-type selectors are
 * not a reliable public locator. This renderer resolves in this order:
 *   1. stable data-vce-id
 *   2. published selector
 *   3. semantic hero selectors / role selectors
 *   4. the ORIGINAL published text or media URL
 *
 * The last step is important for existing V4 blocks that were created before
 * sourceText/sourceUrl existed.
 */

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeComparableText(value: string): string {
  return normalizeText(value)
    .replace(/^[\"'«“„]+|[\"'»”]+$/g, '')
    .replace(/[.!?]+$/g, '')
    .trim()
    .toLocaleLowerCase('fr-FR');
}

function textMatchesSource(rendered: string, source: string): boolean {
  const a = normalizeComparableText(rendered);
  const b = normalizeComparableText(source);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function cssEscape(value: string): string {
  try {
    return CSS.escape(value);
  } catch {
    return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }
}

function findByStableId(id?: string): Element | null {
  if (!id) return null;
  try {
    return document.querySelector(`[data-vce-id="${cssEscape(id)}"]`);
  } catch {
    return null;
  }
}

function findBySelector(selector?: string): Element | null {
  if (!selector) return null;

  try {
    const direct = document.querySelector(selector);
    if (direct) return direct;
  } catch {
    // Continue with tolerant matching.
  }

  const parts = selector
    .split('>')
    .map((part) => part.trim())
    .filter(Boolean);

  for (let start = 0; start < parts.length; start += 1) {
    const candidate = parts.slice(start).join(' > ');
    try {
      const matches = document.querySelectorAll(candidate);
      if (matches.length === 1) return matches[0];
    } catch {
      // Continue.
    }
  }

  return null;
}

function selectorTag(selector?: string): string | null {
  if (!selector) return null;
  const parts = selector.split('>').map((part) => part.trim()).filter(Boolean);
  const last = parts.at(-1) || '';
  const match = last.match(/^([a-z][a-z0-9-]*)/i);
  return match?.[1]?.toLowerCase() || null;
}

function selectorIndex(selector?: string): number | null {
  if (!selector) return null;
  const parts = selector.split('>').map((part) => part.trim()).filter(Boolean);
  const last = parts.at(-1) || '';
  const match = last.match(/:nth-of-type\((\d+)\)/);
  return match ? Number(match[1]) : null;
}

function findSemantic(block: EditorBlock): Element | null {
  const selector = block.selector || '';

  // Hero title lines already have explicit semantic selectors.
  for (const semantic of ['hero-line-1', 'hero-line-2']) {
    if (selector.includes(`data-vce-hero-line="${semantic.slice(-1)}"`) ||
        selector.includes(`data-vce-role=\"${semantic}\"`)) {
      try {
        const byRole = document.querySelector(`[data-vce-role="${semantic}"]`);
        if (byRole) return byRole;
      } catch {}
    }
  }

  if (block.section === 'hero' || selector.includes('hero')) {
    const hero = document.querySelector('#hero-section');
    if (hero) {
      const tag = selectorTag(selector);
      const index = selectorIndex(selector);
      if (tag && index) {
        const candidates = Array.from(hero.querySelectorAll(tag));
        if (candidates[index - 1]) return candidates[index - 1];
      }
    }
  }

  return null;
}

function collectPublishedValues(value: unknown, strings: Set<string>, urls: Set<string>) {
  if (typeof value === 'string') {
    const normalized = normalizeText(value);
    if (normalized.length >= 3) strings.add(normalized);
    if (/^(https?:\/\/|\/|data:)/.test(value)) urls.add(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectPublishedValues(item, strings, urls);
    return;
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectPublishedValues(item, strings, urls);
    }
  }
}

const publishedStrings = new Set<string>();
const publishedUrls = new Set<string>();
collectPublishedValues(publishedSiteContent?.brandData, publishedStrings, publishedUrls);

function findByPublishedSource(block: EditorBlock): Element | null {
  const tag = selectorTag(block.selector);
  const hero = block.section === 'hero' ? document.querySelector('#hero-section') : null;
  const root = hero || document.body;

  if (block.kind === 'text') {
    const candidates = Array.from(
      root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,li,button,a,blockquote,div')
    );

    const exact = candidates.filter((candidate) => {
      const text = normalizeText(candidate.textContent || '');
      if (tag && candidate.tagName.toLowerCase() !== tag) return false;

      // The editor may have selected a rendered value with decorative quotes
      // (for example the Hero tagline: "…"). Compare against the canonical
      // published value after removing those decorations instead of requiring
      // byte-for-byte equality.
      const matchesPublished = Array.from(publishedStrings).some((source) =>
        textMatchesSource(text, source),
      );
      if (!matchesPublished) return false;

      // Do not select an element that already contains the desired value.
      return !textMatchesSource(text, block.text || '');
    });

    if (exact.length === 1) return exact[0];

    // Prefer the smallest exact published text. This avoids selecting a parent
    // div when the real editable node is a p/span/button.
    exact.sort((a, b) =>
      normalizeText(a.textContent || '').length -
      normalizeText(b.textContent || '').length
    );

    if (exact.length) return exact[0];
  }

  if (block.kind === 'media') {
    const candidates = Array.from(root.querySelectorAll('img,video'));
    const matching = candidates.filter((element) => {
      const current = element instanceof HTMLImageElement
        ? element.currentSrc || element.src
        : element instanceof HTMLVideoElement
          ? element.currentSrc || element.src
          : '';
      return publishedUrls.has(current) || Array.from(publishedUrls).some((url) => current.endsWith(url));
    });

    if (matching.length === 1) return matching[0];

    // Header logos commonly share one source URL. Use the selector's tag and
    // position to distinguish them when possible.
    if (matching.length > 1) {
      const header = document.querySelector('#main-nav-header');
      if (header) {
        const headerImages = Array.from(header.querySelectorAll('img'));
        const index = selectorIndex(block.selector);
        if (index && headerImages[index - 1]) return headerImages[index - 1];
        return matching.find((item) => header.contains(item)) || null;
      }
    }
  }

  return null;
}

function findElement(block: EditorBlock): Element | null {
  return (
    findByStableId(block.id) ||
    findBySelector(block.selector) ||
    findSemantic(block) ||
    findByPublishedSource(block)
  );
}

function applyBlock(block: EditorBlock): void {
  const element = findElement(block);
  if (!element) return;

  if (block.id) element.setAttribute('data-vce-id', block.id);

  const html = element as HTMLElement;

  if (!block.visible) {
    html.style.display = 'none';
    return;
  }

  html.style.display = '';

  if (block.kind === 'text' && block.text != null) {
    if (normalizeText(html.textContent || '') !== normalizeText(block.text)) {
      html.textContent = block.text;
    }
  }

  if (block.fontFamily) html.style.fontFamily = block.fontFamily;
  if (block.fontSize) html.style.fontSize = block.fontSize;
  if (block.color) html.style.color = block.color;

  if (block.link != null) {
    if (element instanceof HTMLAnchorElement) element.href = block.link;
    else element.setAttribute('data-vce-link', block.link);
  }

  if (block.kind === 'media' && block.url) {
    if (element instanceof HTMLImageElement && element.src !== block.url) {
      element.src = block.url;
    }
    if (element instanceof HTMLVideoElement && element.src !== block.url) {
      element.src = block.url;
      element.load();
    }
    const nested = element.querySelector('img');
    if (nested instanceof HTMLImageElement && nested.src !== block.url) {
      nested.src = block.url;
    }
  }
}

export const SiteBlocksRenderer: React.FC<{
  config: SiteEditorConfig;
  enabled: boolean;
}> = ({ config, enabled }) => {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer = 0;
    let observerTimer = 0;

    const apply = () => {
      if (cancelled) return;
      for (const block of config.blocks || []) applyBlock(block);
    };

    const scheduleApply = () => {
      window.clearTimeout(observerTimer);
      observerTimer = window.setTimeout(apply, 40);
    };

    const run = () => {
      apply();
      timer = window.setTimeout(apply, 120);
    };

    const raf = requestAnimationFrame(run);

    // React can recreate the page DOM when the admin panel opens/closes or
    // after a state update. Keep the published visual overrides attached to
    // the newly-created nodes instead of relying on a one-shot DOM mutation.
    const observer = new MutationObserver((mutations) => {
      if (cancelled) return;
      if (mutations.some((mutation) => mutation.type === 'childList')) {
        scheduleApply();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.clearTimeout(observerTimer);
      observer.disconnect();
    };
  }, [config, enabled]);

  return null;
};

export default SiteBlocksRenderer;
