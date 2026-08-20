import React, { useEffect } from 'react';
import type { EditorBlock, SiteEditorConfig } from './SiteVisualEditor';

/**
 * V4.0
 * ---------------------------------------------------------------------------
 * L'éditeur visuel est désormais traité comme une couche de publication
 * indépendante du DOM React.
 *
 * Chaque bloc possède déjà un ID stable (element-...). Cet ID devient le
 * premier locator. Le selector n'est plus qu'un locator de secours.
 *
 * Important : l'effet est volontairement exécuté à CHAQUE rendu du parent.
 * Ainsi un logout, une reconnexion, un changement d'état React ou un rerender
 * de section ne peut pas réinjecter silencieusement la valeur de BrandConfig
 * par-dessus la valeur publiée de l'éditeur.
 */

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function findByStableId(id: string): Element | null {
  if (!id) return null;
  try {
    return document.querySelector(`[data-vce-id="${CSS.escape(id)}"]`);
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
    // Fallbacks below.
  }

  // Les anciens selectors ont parfois été créés avec les wrappers admin.
  // On retire progressivement les premiers segments jusqu'à obtenir un
  // chemin unique dans le DOM public.
  const parts = selector
    .split('>')
    .map((part) => part.trim())
    .filter(Boolean);

  for (let start = 1; start < parts.length; start += 1) {
    const candidate = parts.slice(start).join(' > ');
    try {
      const matches = document.querySelectorAll(candidate);
      if (matches.length === 1) return matches[0];
    } catch {
      // Continuer.
    }
  }

  return null;
}

function findByText(block: EditorBlock): Element | null {
  if (block.kind !== 'text' || typeof block.text !== 'string') return null;

  const wanted = normalizeText(block.text);
  if (!wanted) return null;

  const sectionCandidates = block.section
    ? Array.from(
        document.querySelectorAll(
          `[data-vce-section="${CSS.escape(block.section)}"], #${CSS.escape(block.section)}`
        )
      )
    : [];

  const roots: Element[] =
    sectionCandidates.length > 0 ? sectionCandidates : [document.body];

  const tags = 'h1,h2,h3,h4,h5,h6,p,span,li,button,a,blockquote,div';

  for (const root of roots) {
    const candidates = Array.from(root.querySelectorAll(tags));

    // On préfère le nœud dont le texte correspond exactement et qui est le
    // plus petit contenant possible.
    const exact = candidates.filter(
      (candidate) => normalizeText(candidate.textContent || '') === wanted
    );

    if (exact.length) {
      exact.sort(
        (a, b) =>
          (a.textContent || '').length - (b.textContent || '').length
      );
      return exact[0];
    }
  }

  return null;
}

function findByMedia(block: EditorBlock): Element | null {
  if (block.kind !== 'media' || !block.url) return null;

  const wanted = block.url;

  const media = Array.from(document.querySelectorAll('img,video'));
  for (const element of media) {
    const current =
      element instanceof HTMLImageElement
        ? element.currentSrc || element.src
        : element instanceof HTMLVideoElement
          ? element.currentSrc || element.src
          : '';

    if (current === wanted || current.endsWith(wanted)) {
      return element;
    }
  }

  return null;
}

function findElement(block: EditorBlock): Element | null {
  // 1. ID stable publié.
  const byId = findByStableId(block.id);
  if (byId) return byId;

  // 2. Selector exact / ancien selector.
  const bySelector = findBySelector(block.selector);
  if (bySelector) return bySelector;

  // 3. Fallback sémantique.
  const byText = findByText(block);
  if (byText) return byText;

  // 4. Fallback média.
  return findByMedia(block);
}

function applyBlock(block: EditorBlock): void {
  const el = findElement(block);
  if (!el) return;

  // L'ID devient canonique dès qu'on a retrouvé l'élément.
  if (block.id) {
    el.setAttribute('data-vce-id', block.id);
  }

  const html = el as HTMLElement;

  if (!block.visible) {
    html.style.display = 'none';
    return;
  }

  html.style.display = '';

  if (block.kind === 'text' && block.text != null) {
    // textContent évite toute interprétation HTML provenant de l'éditeur.
    if (normalizeText(html.textContent || '') !== normalizeText(block.text)) {
      html.textContent = block.text;
    }
  }

  if (block.fontFamily) html.style.fontFamily = block.fontFamily;
  if (block.fontSize) html.style.fontSize = block.fontSize;
  if (block.color) html.style.color = block.color;

  if (block.link != null) {
    if (el instanceof HTMLAnchorElement) {
      el.href = block.link;
    } else {
      el.setAttribute('data-vce-link', block.link);
    }
  }

  if (block.kind === 'media' && block.url) {
    if (el instanceof HTMLImageElement) {
      if (el.src !== block.url) el.src = block.url;
    }

    if (el instanceof HTMLVideoElement && el.src !== block.url) {
      el.src = block.url;
      el.load();
    }

    const nestedImage = el.querySelector('img');
    if (nestedImage instanceof HTMLImageElement && nestedImage.src !== block.url) {
      nestedImage.src = block.url;
    }
  }
}

function applyAll(blocks: EditorBlock[]): void {
  for (const block of blocks || []) {
    applyBlock(block);
  }
}

export const SiteBlocksRenderer: React.FC<{
  config: SiteEditorConfig;
  enabled: boolean;
}> = ({ config, enabled }) => {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const apply = () => {
      if (!cancelled) applyAll(config.blocks || []);
    };

    // Une passe immédiate après React + deux passes après layout/images.
    const raf1 = requestAnimationFrame(apply);
    const raf2 = requestAnimationFrame(() => {
      const raf3 = requestAnimationFrame(apply);
      window.setTimeout(() => {
        apply();
      }, 0);

      return () => cancelAnimationFrame(raf3);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }); // Intentionnel : réappliquer après CHAQUE rendu App (logout inclus).

  return null;
};

export default SiteBlocksRenderer;
