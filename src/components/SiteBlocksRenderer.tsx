import React, { useEffect } from 'react';
import type { EditorBlock, SiteEditorConfig } from './SiteVisualEditor';

const isAdminVisualEditorOpen = () =>
  typeof document !== 'undefined' &&
  !!document.querySelector('[data-vce-panel="true"]');

const apply = (blocks: EditorBlock[]) => {
  // The visual editor is the only feature allowed to apply editor blocks
  // directly to the DOM. In visitor mode React owns the rendered content.
  if (!isAdminVisualEditorOpen()) return;

  for (const b of blocks || []) {
    if (!b.visible || !b.selector) continue;

    let el: Element | null = null;
    try {
      el = document.querySelector(b.selector);
    } catch {
      continue;
    }

    if (!el) continue;

    const h = el as HTMLElement;

    if (b.kind === 'text') {
      if (b.text != null) h.textContent = b.text;
      if (b.fontFamily) h.style.fontFamily = b.fontFamily;
      if (b.fontSize) h.style.fontSize = b.fontSize;
      if (b.color) h.style.color = b.color;
    }

    if (b.kind === 'media' && b.url) {
      // React owns the product gallery.
      if (el.hasAttribute('data-vce-reactive-gallery')) continue;

      if (el instanceof HTMLImageElement) el.src = b.url;
      if (el instanceof HTMLVideoElement) {
        el.src = b.url;
        el.load();
      }
    }
  }
};

export const SiteBlocksRenderer: React.FC<{
  config: SiteEditorConfig;
}> = ({ config }) => {
  useEffect(() => {
    // V2.5: never apply visual-editor blocks while the public observer view
    // is active. React must remain the sole owner of public content.
    apply(config.blocks || []);
  }, [config.blocks]);

  return null;
};

