import React, { useEffect } from 'react';
import type { EditorBlock, SiteEditorConfig } from './SiteVisualEditor';

function findElement(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

function applyBlock(block: EditorBlock) {
  if (!block.visible || !block.selector) return;

  const el = findElement(block.selector);
  if (!el) return;

  const html = el as HTMLElement;

  if (block.text != null && block.kind === 'text') {
    html.textContent = block.text;
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
      el.src = block.url;
    }

    if (el instanceof HTMLVideoElement && el.src !== block.url) {
      el.src = block.url;
      el.load();
    }

    const image = el.querySelector('img');
    if (image instanceof HTMLImageElement) {
      image.src = block.url;
    }
  }

  html.style.display = block.visible ? '' : 'none';
}

function applyAll(blocks: EditorBlock[]) {
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

    const raf1 = requestAnimationFrame(() => {
      applyAll(config.blocks || []);
    });

    const raf2 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyAll(config.blocks || []);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [config.blocks, enabled]);

  return null;
};
