import React, { useEffect } from 'react';
import type { EditorBlock, SiteEditorConfig } from './SiteVisualEditor';

/**
 * V4.3 — renderer basé sur des identifiants stables.
 *
 * Règle :
 *   1. data-vce-id
 *   2. locator stable (section + tag + valeur originale + occurrence)
 *   3. anciens sélecteurs CSS uniquement pour compatibilité avec les anciens snapshots
 *
 * Aucun nouveau snapshot ne dépend de nth-of-type.
 */

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function comparable(value: string): string {
  return normalizeText(value)
    .replace(/^[\"'«“„]+|[\"'»”]+$/g, '')
    .replace(/[.!?]+$/g, '')
    .trim()
    .toLocaleLowerCase('fr-FR');
}

function sameText(a: string, b: string): boolean {
  const stripQuotes = (value: string) =>
    normalizeText(value).replace(/^["«“]+|["»”]+$/g, '').trim();
  return stripQuotes(a) === stripQuotes(b);
}

function cssEscape(value: string): string {
  try {
    return CSS.escape(value);
  } catch {
    return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }
}

function sectionRoot(section?: string): Element {
  if (section) {
    const id = section === 'hero' ? 'hero-section' : section;
    const root = document.getElementById(id);
    if (root) return root;
  }
  return document.body;
}

function findByStableId(id?: string): Element | null {
  if (!id) return null;
  try {
    return document.querySelector(`[data-vce-id="${cssEscape(id)}"]`);
  } catch {
    return null;
  }
}

function findByLocator(block: EditorBlock): Element | null {
  const locator = block.locator;
  if (!locator) return null;

  const root = sectionRoot(locator.sectionId || block.section);
  const tag = locator.tag || (block.kind === 'media' ? 'img' : 'span');

  let candidates: Element[] = [];
  try {
    candidates = Array.from(root.querySelectorAll(tag));
  } catch {
    return null;
  }

  if (locator.url) {
    const url = locator.url;
    candidates = candidates.filter((element) => {
      const current =
        element instanceof HTMLImageElement
          ? element.currentSrc || element.src
          : element instanceof HTMLVideoElement
            ? element.currentSrc || element.src
            : '';
      return current === url || current.endsWith(url);
    });
  } else if (locator.text) {
    const source = comparable(locator.text);
    candidates = candidates.filter((element) => comparable(element.textContent || '') === source);
  }

  const index = Math.max(0, locator.occurrence || 0);
  return candidates[index] || candidates[0] || null;
}

function findByLegacySelector(selector?: string): Element | null {
  if (!selector) return null;

  // New publications do not create CSS selectors. This branch is only for
  // old V4 snapshots already stored on a deployment.
  try {
    const direct = document.querySelector(selector);
    if (direct) return direct;
  } catch {
    // Ignore malformed historical selectors.
  }

  return null;
}

function findElement(block: EditorBlock): Element | null {
  return (
    findByStableId(block.id) ||
    findByLocator(block) ||
    findByLegacySelector(block.selector)
  );
}

function applyBlock(block: EditorBlock): void {
  const element = findElement(block);
  if (!element) return;

  element.setAttribute('data-vce-id', block.id);

  const html = element as HTMLElement;

  if (!block.visible) {
    html.style.display = 'none';
    return;
  }

  html.style.display = '';

  if (block.kind === 'text' && block.text != null) {
    const current = normalizeText(html.textContent || '');
    const next = normalizeText(block.text);

    if (!sameText(current, next)) {
      html.textContent = block.text;
    }
  }

  if (block.fontFamily) html.style.fontFamily = block.fontFamily;
  if (block.fontSize) html.style.fontSize = block.fontSize;
  if (block.color) html.style.color = block.color;

  if (block.link != null) {
    if (element instanceof HTMLAnchorElement) {
      element.href = block.link;
    } else {
      element.setAttribute('data-vce-link', block.link);
    }
  }

  if (block.kind === 'media' && block.url) {
    if (element instanceof HTMLImageElement && element.src !== block.url) {
      element.src = block.url;
    }

    if (element instanceof HTMLVideoElement && element.src !== block.url) {
      element.src = block.url;
      element.load();
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
      for (const block of config.blocks || []) {
        applyBlock(block);
      }
    };

    const scheduleApply = () => {
      window.clearTimeout(observerTimer);
      observerTimer = window.setTimeout(apply, 35);
    };

    const raf = requestAnimationFrame(() => {
      apply();
      timer = window.setTimeout(apply, 100);
    });

    const observer = new MutationObserver((mutations) => {
      if (cancelled) return;

      // We only need to react to React replacing nodes. Attribute mutations
      // created by this renderer are intentionally not observed.
      if (mutations.some((mutation) => mutation.type === 'childList')) {
        scheduleApply();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

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
