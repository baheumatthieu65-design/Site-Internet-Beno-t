import React, { useEffect, useRef } from 'react';
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

  // Texte + typographie : fonctionne pour p, h1..h6, span, liens,
  // boutons et tout autre élément sélectionné par l'éditeur.
  if (block.text != null && (block.kind === 'text' || block.type === 'text' || block.type === 'heading' || block.type === 'button')) {
    // Ne pas utiliser innerHTML : l'éditeur travaille volontairement sur du texte.
    html.textContent = block.text;
  }

  if (block.fontFamily) html.style.fontFamily = block.fontFamily;
  if (block.fontSize) html.style.fontSize = block.fontSize;
  if (block.color) html.style.color = block.color;

  // Boutons / liens : le lien édité devient également persistant côté observateur.
  if ((block.type === 'button' || block.link != null) && block.link != null) {
    if (el instanceof HTMLAnchorElement) {
      el.href = block.link;
    } else {
      el.setAttribute('data-vce-link', block.link);
    }
  }

  // Images / vidéos.
  if (block.kind === 'media' && block.url) {
    if (el instanceof HTMLImageElement) {
      el.src = block.url;
      el.removeAttribute('srcset');
      el.removeAttribute('sizes');
    }

    if (el instanceof HTMLVideoElement) {
      if (el.src !== block.url) {
        el.src = block.url;
        el.load();
      }
    }

    // Cas d'un élément média encapsulé.
    const image = el.querySelector('img');
    if (image instanceof HTMLImageElement) {
      image.src = block.url;
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
    }
  }

  // Une suppression/masquage depuis l'éditeur doit également être persistante.
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
  const blocksRef = useRef<EditorBlock[]>(config.blocks || []);

  useEffect(() => {
    blocksRef.current = config.blocks || [];
  }, [config.blocks]);

  useEffect(() => {
    if (!enabled) return;

    let raf1 = 0;
    let raf2 = 0;

    const apply = () => applyAll(blocksRef.current);

    // Les composants React peuvent se rerendre juste après le fetch de la
    // configuration. On applique donc après le paint, pas seulement au moment
    // où config.blocks change.
    raf1 = requestAnimationFrame(apply);
    raf2 = requestAnimationFrame(() => requestAnimationFrame(apply));

    const observer = new MutationObserver(() => {
      // Un composant peut réinjecter sa valeur par défaut après notre écriture.
      // Réappliquer les overrides publiés garantit que l'éditeur reste la
      // source de vérité pour les éléments personnalisés.
      apply();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer.disconnect();
    };
  }, [enabled, config.blocks]);

  return null;
};
