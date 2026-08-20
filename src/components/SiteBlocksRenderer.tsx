import React, { useEffect, useRef } from 'react';
import type { EditorBlock, SiteEditorConfig } from './SiteVisualEditor';

function findElement(selector: string): Element | null {
  try { return document.querySelector(selector); } catch { return null; }
}

function applyBlock(block: EditorBlock) {
  if (!block.visible || !block.selector) return;
  const el = findElement(block.selector);
  if (!el) return;

  const html = el as HTMLElement;

  if (block.kind === 'text' && block.text != null) {
    html.textContent = block.text;
  }

  if (block.fontFamily) html.style.fontFamily = block.fontFamily;
  if (block.fontSize) html.style.fontSize = block.fontSize;
  if (block.color) html.style.color = block.color;

  if (block.kind === 'media' && block.url) {
    if (el instanceof HTMLImageElement) {
      el.src = block.url;
      el.removeAttribute('srcset');
      el.removeAttribute('sizes');
    }

    if (el instanceof HTMLVideoElement && el.src !== block.url) {
      el.src = block.url;
      el.load();
    }

    const image = el.querySelector('img');
    if (image instanceof HTMLImageElement) {
      image.src = block.url;
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
    }
  }
}

function applyAll(blocks: EditorBlock[]) {
  for (const block of blocks || []) applyBlock(block);
}

export const SiteBlocksRenderer: React.FC<{
  config: SiteEditorConfig;
  enabled: boolean;
}> = ({ config, enabled }) => {
  const blocksRef = useRef<EditorBlock[]>(config.blocks || []);

  useEffect(() => {
    blocksRef.current = config.blocks || [];
  }, [config.blocks]);

  useEffect(() => {
    if (!enabled) return;

    const apply = () => applyAll(blocksRef.current);
    const raf1 = requestAnimationFrame(apply);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(apply));

    // Observe only DOM insertions/re-renders. Observing characterData here
    // would react to our own textContent writes and create an infinite loop.
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer.disconnect();
    };
  }, [enabled, config.blocks]);

  return null;
};
