import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Save,
  Settings2,
  Type,
  X,
} from 'lucide-react';
import type { BrandConfig, SectionId } from '../types';

export type AdminBarPosition = 'top' | 'bottom' | 'left' | 'right';

export interface EditorBlock {
  id: string;
  type: 'text' | 'heading' | 'button' | 'image' | 'video' | 'spacer';
  section: SectionId;
  x: number;
  y: number;
  text?: string;
  url?: string;
  link?: string;
  visible: boolean;

  // V9: sélection persistante d'un élément DOM précis.
  selector?: string;
  kind?: 'text' | 'media';
  fontFamily?: string;
  fontSize?: string;
  color?: string;
}

export interface SiteEditorConfig {
  adminBarPosition: AdminBarPosition;
  heroBackground?: {
    type: 'image' | 'gif' | 'video';
    url: string;
    poster?: string;
    overlay?: number;
    positionX?: number;
    positionY?: number;
  };
  blocks: EditorBlock[];
}

interface Props {
  brandData: BrandConfig;
  config: SiteEditorConfig;
  onChange: (config: SiteEditorConfig) => void;
  onSave: (nextConfig?: SiteEditorConfig) => Promise<void> | void;
}

const FONT_OPTIONS = [
  ['Playfair Display', 'Playfair Display'],
  ['Cormorant Garamond', 'Cormorant Garamond'],
  ['Bodoni Moda', 'Bodoni Moda'],
  ['Cinzel', 'Cinzel'],
  ['Libre Baskerville', 'Libre Baskerville'],
  ['EB Garamond', 'EB Garamond'],
  ['Lora', 'Lora'],
  ['DM Serif Display', 'DM Serif Display'],
  ['Great Vibes', 'Great Vibes'],
  ['Allura', 'Allura'],
  ['Alex Brush', 'Alex Brush'],
  ['Ballet', 'Ballet'],
  ['Berkshire Swash', 'Berkshire Swash'],
  ['Bonheur Royale', 'Bonheur Royale'],
  ['Clicker Script', 'Clicker Script'],
  ['Dancing Script', 'Dancing Script'],
  ['Italianno', 'Italianno'],
  ['Lovers Quarrel', 'Lovers Quarrel'],
  ['Mrs Saint Delafield', 'Mrs Saint Delafield'],
  ['Parisienne', 'Parisienne'],
  ['Pinyon Script', 'Pinyon Script'],
  ['Sacramento', 'Sacramento'],
  ['Tangerine', 'Tangerine'],
  ['Qwigley', 'Qwigley'],
  ['Lavishly Yours', 'Lavishly Yours'],
  ['Mea Culpa', 'Mea Culpa'],
  ['Ms Madi', 'Ms Madi'],
  ['WindSong', 'WindSong'],
  ['Water Brush', 'Water Brush'],
  ['Inter', 'Inter'],
  ['Montserrat', 'Montserrat'],
  ['Arial', 'Arial'],
];

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Ballet&family=Berkshire+Swash&family=Bonheur+Royale&family=Cinzel:wght@400;500;600;700&family=Clicker+Script&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Dancing+Script:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Great+Vibes&family=Italianno&family=Lavishly+Yours&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lovers+Quarrel&family=Mea+Culpa&family=Montserrat:wght@400;500;600;700&family=Mrs+Saint+Delafield&family=Ms+Madi&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Qwigley&family=Sacramento&family=Tangerine:wght@400;700&family=Water+Brush&family=WindSong:wght@400;500&display=swap';

function escapeCssString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getUniqueSelector(element: Element): string {
  const existing = element.getAttribute('data-vce-selector');
  if (existing) return `[data-vce-selector="${escapeCssString(existing)}"]`;

  const role = element.getAttribute('data-vce-role');
  if (role) {
    const selector = `[data-vce-role="${escapeCssString(role)}"]`;
    if (document.querySelectorAll(selector).length === 1) return selector;
  }

  // Hero: chaque span de titre est désormais ciblé indépendamment.
  const heroLine = element.getAttribute('data-vce-hero-line');
  if (heroLine) return `[data-vce-hero-line="${escapeCssString(heroLine)}"]`;

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && parts.length < 6) {
    const tag = current.tagName.toLowerCase();
    const parent = current.parentElement;

    if (!parent) {
      parts.unshift(tag);
      break;
    }

    const siblings = Array.from(parent.children).filter(
      (child) => child.tagName === current!.tagName
    );
    const index = siblings.indexOf(current) + 1;

    parts.unshift(`${tag}:nth-of-type(${index})`);
    const candidate = parts.join(' > ');

    try {
      if (document.querySelectorAll(candidate).length === 1) return candidate;
    } catch {}

    current = parent;
  }

  return parts.join(' > ');
}

function textFromElement(element: Element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
}

function isEditableTextElement(element: Element) {
  const tag = element.tagName.toLowerCase();
  if (['script', 'style', 'svg', 'path', 'option'].includes(tag)) return false;
  if (element.closest('[data-vce-ignore="true"]')) return false;
  if (element.closest('button, a')) return false;
  return textFromElement(element).length > 0;
}

function isEditableMediaElement(element: Element) {
  return element instanceof HTMLImageElement || element instanceof HTMLVideoElement;
}

const applyAdminBarPosition = (position: AdminBarPosition) => {
  const bar = document.getElementById('admin-top-bar');
  if (!bar) return;

  bar.style.position = 'fixed';
  bar.style.zIndex = '1000';
  bar.style.margin = '0';
  bar.style.transform = '';
  bar.style.top = 'auto';
  bar.style.bottom = 'auto';
  bar.style.left = 'auto';
  bar.style.right = 'auto';

  if (position === 'top') {
    bar.style.top = '0';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.width = '100%';
  } else if (position === 'bottom') {
    bar.style.bottom = '0';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.width = '100%';
  } else if (position === 'left') {
    bar.style.top = '50%';
    bar.style.left = '0';
    bar.style.width = 'min(92vw, 420px)';
    bar.style.transform = 'translateY(-50%)';
  } else {
    bar.style.top = '50%';
    bar.style.right = '0';
    bar.style.width = 'min(92vw, 420px)';
    bar.style.transform = 'translateY(-50%)';
  }
};

export const SiteVisualEditor: React.FC<Props> = ({
  config,
  onChange,
  onSave,
}) => {
  const [open, setOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<{
    selector: string;
    element: Element;
    kind: 'text' | 'media';
    originalText: string;
    originalUrl: string;
  } | null>(null);

  const [replacementText, setReplacementText] = useState('');
  const [fontFamily, setFontFamily] = useState('Playfair Display');
  const [fontSize, setFontSize] = useState('48px');
  const [color, setColor] = useState('#F5EEDF');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [replacementImageUrl, setReplacementImageUrl] = useState('');
  const [libraryItems, setLibraryItems] = useState<Array<{ url: string; pathname?: string }>>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    link.dataset.vceFonts = 'true';
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, []);

  useEffect(() => {
    if (open) applyAdminBarPosition(config.adminBarPosition || 'top');
  }, [open, config.adminBarPosition]);

  useEffect(() => {
    if (!selectionMode) return;

    const handler = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      // Ne jamais intercepter un clic dans le panneau lui-même.
      if (target.closest('[data-vce-panel="true"]')) return;
      if (target.closest('#admin-top-bar')) return;
      if (target.closest('[data-vce-ignore="true"]')) return;

      const media = target.closest('img, video');
      const text = target.closest(
        '[data-vce-editable="true"], h1, h2, h3, h4, h5, h6, p, blockquote, li, span'
      );

      const element = media || text;
      if (!element) return;

      // Critique : si on clique sur un enfant texte, on ne remonte PAS
      // jusqu'au h1 parent. Cela dissocie réellement les deux lignes du Hero.
      if (media && isEditableMediaElement(media)) {
        event.preventDefault();
        event.stopPropagation();

        const selector = getUniqueSelector(media);
        const currentUrl =
          media instanceof HTMLImageElement
            ? media.currentSrc || media.src
            : media instanceof HTMLVideoElement
              ? media.currentSrc || media.src
              : '';

        setSelected({
          selector,
          element: media,
          kind: 'media',
          originalText: '',
          originalUrl: currentUrl,
        });
        setReplacementImageUrl(currentUrl);
        return;
      }

      if (text && isEditableTextElement(text)) {
        event.preventDefault();
        event.stopPropagation();

        const selector = getUniqueSelector(text);
        setSelected({
          selector,
          element: text,
          kind: 'text',
          originalText: textFromElement(text),
          originalUrl: '',
        });

        setReplacementText(textFromElement(text));

        const style = window.getComputedStyle(text);
        setFontFamily(
          style.fontFamily.split(',')[0].replace(/^['"]|['"]$/g, '') ||
            'Playfair Display'
        );
        setFontSize(style.fontSize || '48px');
        setColor(style.color || '#F5EEDF');
      }
    };

    // Capture phase pour prendre le contrôle avant les handlers de la page.
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [selectionMode]);

  const selectedBlock = useMemo(
    () =>
      selected
        ? config.blocks.find((block) => block.selector === selected.selector)
        : undefined,
    [selected, config.blocks]
  );

  const updateBlock = (
    patch: Partial<EditorBlock>
  ): SiteEditorConfig | null => {
    if (!selected) return null;

    const blocks = [...config.blocks];
    const index = blocks.findIndex(
      (block) => block.selector === selected.selector
    );

    const base: EditorBlock = {
      id: `element-${Date.now()}`,
      type: selected.kind === 'media' ? 'image' : 'text',
      section: 'hero',
      x: 50,
      y: 50,
      visible: true,
      selector: selected.selector,
      kind: selected.kind,
      text: selected.originalText,
      ...patch,
    };

    if (index === -1) blocks.push(base);
    else blocks[index] = { ...blocks[index], ...patch };

    const nextConfig = { ...config, blocks };
    onChange(nextConfig);
    return nextConfig;
  };

  const selectTextStyle = (
    next: { text?: string; fontFamily?: string; fontSize?: string; color?: string }
  ) => {
    setReplacementText(next.text ?? replacementText);
    setFontFamily(next.fontFamily ?? fontFamily);
    setFontSize(next.fontSize ?? fontSize);
    setColor(next.color ?? color);

    if (selected?.element) {
      const el = selected.element as HTMLElement;
      if (next.text !== undefined) el.textContent = next.text;
      if (next.fontFamily) el.style.fontFamily = next.fontFamily;
      if (next.fontSize) el.style.fontSize = next.fontSize;
      if (next.color) el.style.color = next.color;
    }
  };

  const uploadReplacementImage = async (file: File) => {
    if (!selected || selected.kind !== 'media') return;

    setUploadingImage(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/site-media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || `Upload image: HTTP ${response.status}`);
      }

      const url = String(data.url);
      setReplacementImageUrl(url);

      const media = selected.element;
      if (media instanceof HTMLImageElement) {
        media.src = url;
      } else if (media instanceof HTMLVideoElement) {
        media.src = url;
        media.load();
      }

      updateBlock({
        type: media instanceof HTMLVideoElement ? 'video' : 'image',
        kind: 'media',
        url,
        selector: selected.selector,
        visible: true,
      });

      setMessage('Image importée. Cliquez sur « Enregistrer et publier » pour la conserver.');
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible d’importer cette image.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const loadMediaLibrary = async () => {
    setLibraryOpen(true);
    setError(null);

    try {
      const response = await fetch('/api/site-media', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || `Bibliothèque: HTTP ${response.status}`);
      }

      setLibraryItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger la bibliothèque média.'
      );
    }
  };

  const chooseLibraryImage = (url: string) => {
    if (!selected || selected.kind !== 'media') return;

    setReplacementImageUrl(url);

    const media = selected.element;
    if (media instanceof HTMLImageElement) {
      media.src = url;
    } else if (media instanceof HTMLVideoElement) {
      media.src = url;
      media.load();
    }

    updateBlock({
      type: media instanceof HTMLVideoElement ? 'video' : 'image',
      kind: 'media',
      url,
      selector: selected.selector,
      visible: true,
    });

    setLibraryOpen(false);
    setMessage('Média sélectionné. Cliquez sur « Enregistrer et publier ».');
  };

  const saveSelected = async () => {
    if (!selected) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      let nextConfig: SiteEditorConfig | null = null;

      if (selected.kind === 'text') {
        const el = selected.element as HTMLElement;

        el.textContent = replacementText;
        el.style.fontFamily = fontFamily;
        el.style.fontSize = fontSize;
        el.style.color = color;

        nextConfig = updateBlock({
          type: 'text',
          kind: 'text',
          text: replacementText,
          fontFamily,
          fontSize,
          color,
          selector: selected.selector,
          visible: true,
        });
      } else {
        if (!replacementImageUrl) {
          throw new Error(
            'Sélectionnez une image de remplacement.'
          );
        }

        const media = selected.element;

        nextConfig = updateBlock({
          type:
            media instanceof HTMLVideoElement
              ? 'video'
              : 'image',
          kind: 'media',
          url: replacementImageUrl,
          selector: selected.selector,
          visible: true,
        });
      }

      if (!nextConfig) {
        throw new Error(
          'Impossible de construire la nouvelle configuration.'
        );
      }

      // IMPORTANT :
      // on transmet la configuration fraîche à App.
      // Ne pas appeler onSave() sans argument ici :
      // le state React "config" peut encore contenir l'ancienne valeur.
      await onSave(nextConfig);

      setMessage(
        'Modification enregistrée et publiée. Elle restera après rechargement.'
      );

      window.setTimeout(() => {
        setMessage(null);
      }, 3500);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'La modification n’a pas pu être publiée.'
      );
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    setSelectionMode(false);
    setSelected(null);
    setMessage(null);
    setError(null);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        data-vce-ignore="true"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[2000] rounded-full bg-[#d4af37] text-black p-3 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
        title="Ouvrir l’éditeur visuel"
      >
        <Settings2 className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside
      data-vce-panel="true"
      className="fixed bottom-4 right-4 z-[2000] w-[min(460px,calc(100vw-2rem))] max-h-[88vh] overflow-hidden rounded-2xl bg-[#111711] text-white border border-[#d4af37]/70 shadow-2xl"
    >
      <div
        data-vce-ignore="true"
        className="flex items-center justify-between px-4 py-3 border-b border-[#334236] bg-[#172019]"
      >
        <div>
          <strong className="text-[#d4af37] block">Éditeur visuel</strong>
          <span className="text-[10px] text-[#9aaa9d]">
            Sélectionnez précisément un élément
          </span>
        </div>

        <button
          type="button"
          onClick={close}
          className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[calc(88vh-80px)] space-y-4">
        <div data-vce-ignore="true">
          <label className="text-xs block mb-1 text-[#c4ceb8]">
            Barre administrateur
          </label>
          <select
            value={config.adminBarPosition || 'top'}
            onChange={(e) => {
              const position = e.target.value as AdminBarPosition;
              onChange({ ...config, adminBarPosition: position });
              requestAnimationFrame(() => applyAdminBarPosition(position));
            }}
            className="w-full rounded-lg bg-[#1c261e] border border-[#405044] px-3 py-2 text-white cursor-pointer"
          >
            <option value="top">Haut</option>
            <option value="bottom">Bas</option>
            <option value="left">Gauche</option>
            <option value="right">Droite</option>
          </select>
        </div>

        <button
          data-vce-ignore="true"
          type="button"
          onClick={() => {
            setSelectionMode((value) => !value);
            setSelected(null);
            setMessage(null);
            setError(null);
          }}
          className={`w-full rounded-lg py-3 font-bold cursor-pointer ${
            selectionMode
              ? 'bg-[#d4af37] text-black'
              : 'bg-[#263329] text-white border border-[#405044]'
          }`}
        >
          <Type className="inline w-4 h-4 mr-2" />
          {selectionMode
            ? 'Sélection directe ACTIVÉE — cliquez sur un texte ou une image'
            : 'Modifier directement sur la page'}
        </button>

        {selected && (
          <section
            data-vce-ignore="true"
            className="rounded-xl border border-[#d4af37]/50 bg-[#151d17] p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <strong className="text-[#d4af37]">
                {selected.kind === 'text'
                  ? 'Texte sélectionné'
                  : 'Image sélectionnée'}
              </strong>
              <span className="text-[10px] text-[#87968a]">
                élément indépendant
              </span>
            </div>

            {selected.kind === 'text' ? (
              <>
                <label className="block text-xs text-[#aab6ac]">
                  Texte actuel
                  <textarea
                    readOnly
                    value={selected.originalText}
                    className="mt-1 w-full min-h-[58px] rounded-lg bg-[#080c09] border border-[#334236] px-3 py-2 text-sm text-[#cbd3cb]"
                  />
                </label>

                <label className="block text-xs text-[#aab6ac]">
                  Nouveau texte
                  <textarea
                    value={replacementText}
                    onChange={(e) =>
                      selectTextStyle({ text: e.target.value })
                    }
                    className="mt-1 w-full min-h-[70px] rounded-lg bg-[#080c09] border border-[#d4af37]/70 px-3 py-2 text-sm text-white"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-[#aab6ac]">
                    Police
                    <select
                      value={fontFamily}
                      onChange={(e) =>
                        selectTextStyle({ fontFamily: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg bg-[#080c09] border border-[#405044] px-2 py-2 text-white"
                    >
                      {FONT_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs text-[#aab6ac]">
                    Taille
                    <select
                      value={fontSize}
                      onChange={(e) =>
                        selectTextStyle({ fontSize: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg bg-[#080c09] border border-[#405044] px-2 py-2 text-white"
                    >
                      {[
                        12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48,
                        52, 56, 60, 64, 72, 80, 96,
                      ].map((size) => (
                        <option key={size} value={`${size}px`}>
                          {size}px
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-xs text-[#aab6ac]">
                  Couleur du texte
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) =>
                        selectTextStyle({ color: e.target.value })
                      }
                      className="w-12 h-10 rounded cursor-pointer bg-transparent"
                    />
                    <input
                      value={color}
                      onChange={(e) =>
                        selectTextStyle({ color: e.target.value })
                      }
                      className="flex-1 rounded-lg bg-[#080c09] border border-[#405044] px-3 text-white uppercase"
                    />
                  </div>
                </label>

                <div
                  className="rounded-lg border border-[#334236] bg-[#0b100c] p-4 text-center"
                  style={{
                    fontFamily,
                    fontSize,
                    color,
                  }}
                >
                  {replacementText || 'Aperçu'}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-[#cbd3cb]">
                  <ImageIcon className="inline w-4 h-4 mr-2 text-[#d4af37]" />
                  Image sélectionnée indépendamment.
                </div>

                <div className="rounded-xl border border-[#405044] bg-[#0b100c] p-3">
                  <div className="text-xs font-semibold text-[#d4af37] mb-2">
                    Sélectionner une image de remplacement
                  </div>

                  {replacementImageUrl && (
                    <img
                      src={replacementImageUrl}
                      alt="Aperçu du remplacement"
                      className="w-full h-32 object-cover rounded-lg mb-3 border border-[#334236]"
                    />
                  )}

                  <label className="block cursor-pointer rounded-lg bg-[#d4af37] text-black font-bold text-center py-2.5 hover:brightness-110">
                    {uploadingImage ? 'Importation...' : '📤 Importer une image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadReplacementImage(file);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void loadMediaLibrary()}
                    className="w-full mt-2 rounded-lg border border-[#405044] bg-[#1c261e] text-white py-2.5 font-semibold hover:bg-[#263329]"
                  >
                    📚 Choisir dans la bibliothèque
                  </button>

                  <div className="mt-2 text-[10px] text-[#87968a]">
                    JPG, PNG, WebP, GIF ou AVIF. L'image est envoyée sur
                    Vercel Blob puis publiée après « Enregistrer et publier ».
                  </div>
                </div>

                {libraryOpen && (
                  <div className="rounded-xl border border-[#405044] bg-[#080c09] p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#c4ceb8]">
                        Bibliothèque média
                      </span>
                      <button
                        type="button"
                        onClick={() => setLibraryOpen(false)}
                        className="text-xs text-[#aab6ac] hover:text-white"
                      >
                        Fermer
                      </button>
                    </div>

                    {libraryItems.length === 0 ? (
                      <div className="text-xs text-[#87968a] py-3 text-center">
                        Aucune image disponible.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {libraryItems.map((item) => (
                          <button
                            type="button"
                            key={item.url}
                            onClick={() => chooseLibraryImage(item.url)}
                            className={`rounded-lg overflow-hidden border ${
                              replacementImageUrl === item.url
                                ? 'border-[#d4af37]'
                                : 'border-[#334236]'
                            }`}
                            title="Utiliser cette image"
                          >
                            <img
                              src={item.url}
                              alt=""
                              className="w-full h-20 object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={saveSelected}
              className="w-full rounded-lg bg-[#d4af37] text-black font-bold py-3 cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                  Enregistrement et publication...
                </>
              ) : (
                <>
                  <Save className="inline w-4 h-4 mr-2" />
                  Enregistrer et publier
                </>
              )}
            </button>

            {message && (
              <div className="rounded-lg border border-emerald-700/60 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
                <Check className="inline w-4 h-4 mr-1" />
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}
          </section>
        )}
      </div>
    </aside>
  );
};
