import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Image as ImageIcon, Loader2, Move, Save, Settings2, Type, X } from 'lucide-react';
import type { BrandConfig, GiteSiteConfig, SectionId } from '../types';
import { GiteFreeformEditor } from './GiteFreeformEditor';
import { FloatingMediaManager } from './FloatingMediaManager';
import { prepareImageForUpload } from '../utils/mediaUpload';

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
  /** Ancien locator CSS conservé uniquement pour compatibilité historique. */
  selector?: string;
  /** Locator stable utilisé lorsque le DOM ne porte pas encore data-vce-id. */
  locator?: {
    tag?: string;
    text?: string;
    url?: string;
    sectionId?: string;
    occurrence?: number;
  };
  kind?: 'text' | 'media';
  fontFamily?: string;
  fontSize?: string;
  color?: string;
}

export interface SiteEditorConfig {
  // Conservé pour relire les configurations déjà publiées ; la barre est désormais intégrée à l'éditeur.
  adminBarPosition?: AdminBarPosition;
  heroBackground?: {
    type: 'image' | 'gif' | 'video';
    url: string;
    poster?: string;
    overlay?: number;
    positionX?: number;
    positionY?: number;
  };
  blocks: EditorBlock[];
  floatingImages?: import('../data/floatingMedia').FloatingMediaItem[];
}

interface Props {
  brandData: BrandConfig;
  config: SiteEditorConfig;
  onChange: (config: SiteEditorConfig) => void;
  onSave: (nextConfig?: SiteEditorConfig) => Promise<void> | void;
  onOpenCustomizer?: (tab?: 'theme' | 'gite') => void;
  isGitePage?: boolean;
  giteConfig?: GiteSiteConfig;
  onGiteChange?: (config: GiteSiteConfig) => void;
  onGiteSave?: (config: GiteSiteConfig) => Promise<void> | void;
  onLogout?: () => void | Promise<void>;
  adminToolbar?: React.ReactNode;
  floatingMediaOpen?: boolean;
  onToggleFloatingMedia?: () => void;
}

const FONT_OPTIONS = [
  'Playfair Display', 'Cormorant Garamond', 'Bodoni Moda', 'Cinzel',
  'Libre Baskerville', 'EB Garamond', 'Lora', 'DM Serif Display',
  'Great Vibes', 'Allura', 'Alex Brush', 'Ballet', 'Berkshire Swash',
  'Bonheur Royale', 'Clicker Script', 'Dancing Script', 'Italianno',
  'Lovers Quarrel', 'Mrs Saint Delafield', 'Parisienne', 'Pinyon Script',
  'Sacramento', 'Tangerine', 'Qwigley', 'Lavishly Yours', 'Mea Culpa',
  'Ms Madi', 'WindSong', 'Water Brush', 'Inter', 'Montserrat', 'Arial',
];

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Ballet&family=Berkshire+Swash&family=Bonheur+Royale&family=Cinzel:wght@400;500;600;700&family=Clicker+Script&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Dancing+Script:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Great+Vibes&family=Italianno&family=Lavishly+Yours&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lovers+Quarrel&family=Mea+Culpa&family=Montserrat:wght@400;500;600;700&family=Mrs+Saint+Delafield&family=Ms+Madi&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Qwigley&family=Sacramento&family=Tangerine:wght@400;700&family=Water+Brush&family=WindSong:wght@400;500&display=swap';

const esc = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

function cloneEditorConfig(config: SiteEditorConfig): SiteEditorConfig {
  return JSON.parse(JSON.stringify(config)) as SiteEditorConfig;
}

function stableHash(value: string): string {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function readableText(el: Element): string {
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

function sectionFor(el: Element): SectionId {
  const section = el.closest('section[id]')?.getAttribute('id');
  const allowed: SectionId[] = ['hero', 'collection', 'comparatif', 'origines', 'lookbook', 'contact'];
  return allowed.includes(section as SectionId) ? section as SectionId : 'hero';
}

function stableElementId(el: Element): string {
  const existing = el.getAttribute('data-vce-id');
  if (existing) return existing;

  const role = el.getAttribute('data-vce-role');
  if (role) return `vce-${role}`;

  const explicit = el.getAttribute('data-vce-selector');
  if (explicit) return `vce-${explicit}`;

  const section = sectionFor(el);
  const tag = el.tagName.toLowerCase();
  const text = readableText(el).slice(0, 180);
  const url = el instanceof HTMLImageElement
    ? (el.currentSrc || el.src)
    : el instanceof HTMLVideoElement
      ? (el.currentSrc || el.src)
      : '';

  const id = `vce-${stableHash(`${section}|${tag}|${text}|${url}`)}`;
  el.setAttribute('data-vce-id', id);
  return id;
}

function locatorFor(el: Element) {
  const sectionId = sectionFor(el);
  const tag = el.tagName.toLowerCase();
  const text = readableText(el);
  const url = el instanceof HTMLImageElement
    ? (el.currentSrc || el.src)
    : el instanceof HTMLVideoElement
      ? (el.currentSrc || el.src)
      : undefined;

  const root = el.closest('section[id]') || document.body;
  const same = Array.from(root.querySelectorAll(tag)).filter((candidate) => {
    if (url) {
      const current = candidate instanceof HTMLImageElement
        ? (candidate.currentSrc || candidate.src)
        : candidate instanceof HTMLVideoElement
          ? (candidate.currentSrc || candidate.src)
          : '';
      return current === url;
    }
    return readableText(candidate) === text;
  });
  const occurrence = Math.max(0, same.indexOf(el));

  return {
    tag,
    text: text || undefined,
    url,
    sectionId,
    occurrence,
  };
}

function legacySelectorFor(el: Element): string {
  const explicit = el.getAttribute('data-vce-selector');
  if (explicit) return `[data-vce-selector="${esc(explicit)}"]`;
  const heroLine = el.getAttribute('data-vce-hero-line');
  if (heroLine) return `[data-vce-hero-line="${esc(heroLine)}"]`;
  const role = el.getAttribute('data-vce-role');
  if (role) return `[data-vce-role="${esc(role)}"]`;
  return '';
}

function isText(el: Element) {
  const tag = el.tagName.toLowerCase();
  if (['script', 'style', 'svg', 'path', 'option'].includes(tag)) return false;
  if (el.closest('[data-vce-ignore="true"]')) return false;
  if (el.closest('[data-vce-panel="true"]')) return false;
  return readableText(el).length > 0;
}

export const SiteVisualEditor: React.FC<Props> = ({
  config,
  onChange,
  onSave,
  onOpenCustomizer,
  adminToolbar,
  floatingMediaOpen = false,
  onToggleFloatingMedia,
  isGitePage = false,
  giteConfig,
  onGiteChange,
  onGiteSave,
  onLogout,
}) => {
  const [open, setOpen] = useState(false);
  const [editorPage, setEditorPage] = useState<'boutique' | 'gite'>(isGitePage ? 'gite' : 'boutique');
  const [giteFreeformOpen, setGiteFreeformOpen] = useState(false);
  const [siteEditorMinimized, setSiteEditorMinimized] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
  } | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<{
    id: string;
    selector: string;
    locator: NonNullable<EditorBlock['locator']>;
    element: Element;
    kind: 'text' | 'media';
    originalText: string;
    originalUrl: string;
    originalStyle: string;
    originalConfig: SiteEditorConfig;
  } | null>(null);

  const [text, setText] = useState('');
  const [font, setFont] = useState('Playfair Display');
  const [size, setSize] = useState('48px');
  const [color, setColor] = useState('#F5EEDF');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [library, setLibrary] = useState<Array<{ url: string; pathname?: string }>>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const movePanel = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const x = Math.max(8, Math.min(
        window.innerWidth - drag.width - 8,
        drag.originX + event.clientX - drag.startX,
      ));
      const y = Math.max(8, Math.min(
        window.innerHeight - drag.height - 8,
        drag.originY + event.clientY - drag.startY,
      ));

      setPanelPosition({ x, y });
    };

    const stopDragging = () => {
      dragRef.current = null;
    };

    window.addEventListener('pointermove', movePanel);
    window.addEventListener('pointerup', stopDragging);

    return () => {
      window.removeEventListener('pointermove', movePanel);
      window.removeEventListener('pointerup', stopDragging);
    };
  }, []);

  const startPanelDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('button, input, textarea, select, a')) return;

    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.preventDefault();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      width: rect.width,
      height: rect.height,
    };
    setPanelPosition({ x: rect.left, y: rect.top });
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    link.dataset.vceFonts = 'true';
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  useEffect(() => {
    if (!selecting) return;

    const click = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      if (target.closest('[data-vce-panel="true"], #admin-top-bar, [data-vce-ignore="true"]')) return;

      const media = target.closest('img, video');
      const element = media || target.closest(
        '[data-vce-editable="true"], h1, h2, h3, h4, h5, h6, p, blockquote, li, span',
      );
      if (!element) return;

      event.preventDefault();
      event.stopPropagation();

      if (media) {
        const url = media instanceof HTMLImageElement
          ? media.currentSrc || media.src
          : media instanceof HTMLVideoElement
            ? media.currentSrc || media.src
            : '';

        const stableMedia = media.closest('[data-vce-id]') || media;
        const id = stableElementId(stableMedia);
        setSelected({
          id,
          selector: legacySelectorFor(stableMedia),
          locator: locatorFor(stableMedia),
          element: stableMedia,
          kind: 'media',
          originalText: '',
          originalUrl: url,
          originalStyle: (media as HTMLElement).getAttribute('style') || '',
          originalConfig: cloneEditorConfig(config),
        });
        setImageUrl(url);
        setSelecting(false);
        return;
      }

      if (isText(element)) {
        const stableElement = element.closest('[data-vce-id]') || element;
        const style = getComputedStyle(stableElement);
        const id = stableElementId(stableElement);
        setSelected({
          id,
          selector: legacySelectorFor(stableElement),
          locator: locatorFor(stableElement),
          element: stableElement,
          kind: 'text',
          originalText: readableText(element),
          originalUrl: '',
          originalStyle: (element as HTMLElement).getAttribute('style') || '',
          originalConfig: cloneEditorConfig(config),
        });
        setText(readableText(stableElement));
        setFont(style.fontFamily.split(',')[0].replace(/["']/g, '') || 'Playfair Display');
        setSize(style.fontSize || '48px');
        setColor(style.color || '#F5EEDF');
        setSelecting(false);
      }
    };

    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, [selecting]);

  const blockIndex = useMemo(
    () => selected
      ? config.blocks.findIndex((b) => b.id === selected.id || (b.selector && b.selector === selected.selector))
      : -1,
    [config.blocks, selected],
  );

  const commitBlock = (patch: Partial<EditorBlock>) => {
    if (!selected) return config;

    const blocks = [...config.blocks];
    const existing: EditorBlock = blockIndex >= 0
      ? blocks[blockIndex]
      : {
          id: selected.id,
          type: selected.kind === 'media' ? 'image' : 'text',
          section: sectionFor(selected.element),
          x: 50,
          y: 50,
          visible: true,
          selector: selected.selector || undefined,
          locator: selected.locator,
          kind: selected.kind,
        };

    const nextBlock = {
      ...existing,
      ...patch,
      id: existing.id || selected.id,
      // Le locator décrit la valeur AVANT la première modification. Il ne
      // doit jamais être remplacé par la nouvelle valeur, sinon un élément
      // générique sans data-vce-id deviendrait introuvable après refresh.
      locator: existing.locator || selected.locator,
    };
    if (blockIndex >= 0) blocks[blockIndex] = nextBlock;
    else blocks.push(nextBlock);

    const next = { ...config, blocks };
    onChange(next);
    return next;
  };

  const applyTextStyle = (
    patch: { text?: string; fontFamily?: string; fontSize?: string; color?: string },
  ) => {
    if (!selected || selected.kind !== 'text') return;

    const el = selected.element as HTMLElement;
    if (patch.text !== undefined) el.textContent = patch.text;
    if (patch.fontFamily) el.style.fontFamily = patch.fontFamily;
    if (patch.fontSize) el.style.fontSize = patch.fontSize;
    if (patch.color) el.style.color = patch.color;

    setText(patch.text ?? text);
    setFont(patch.fontFamily ?? font);
    setSize(patch.fontSize ?? size);
    setColor(patch.color ?? color);

    commitBlock({
      type: 'text',
      kind: 'text',
      id: selected.id,
      selector: selected.selector || undefined,
      locator: selected.locator,
      text: patch.text ?? text,
      fontFamily: patch.fontFamily ?? font,
      fontSize: patch.fontSize ?? size,
      color: patch.color ?? color,
      visible: true,
    });
  };

  const chooseImage = (url: string) => {
    if (!selected || selected.kind !== 'media') return;

    const el = selected.element;
    if (el instanceof HTMLImageElement) el.src = url;
    if (el instanceof HTMLVideoElement) {
      el.src = url;
      el.load();
    }

    setImageUrl(url);
    commitBlock({
      type: el instanceof HTMLVideoElement ? 'video' : 'image',
      kind: 'media',
      id: selected.id,
      selector: selected.selector || undefined,
      locator: selected.locator,
      url,
      visible: true,
    });
    setMessage('Image remplacée. Enregistre pour publier.');
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError('');
    setMessage('');

    try {
      const preparedFile = await prepareImageForUpload(file);
      const form = new FormData();
      form.append('file', preparedFile);

      const response = await fetch('/api/site-media', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || `Upload image : HTTP ${response.status}`);
      }

      chooseImage(String(data.url));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload impossible.');
    } finally {
      setUploading(false);
    }
  };

  const loadLibrary = async () => {
    setLibraryLoading(true);
    setError('');

    try {
      const response = await fetch('/api/site-media', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || `Bibliothèque : HTTP ${response.status}`);
      }

      setLibrary(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bibliothèque indisponible.');
    } finally {
      setLibraryLoading(false);
    }
  };

  const cancelChanges = () => {
    if (!selected) return;

    const el = selected.element as HTMLElement;

    // Restore text/content.
    if (selected.kind === 'text') {
      el.textContent = selected.originalText;
    }

    // Restore the original image/video URL.
    if (selected.kind === 'media') {
      if (el instanceof HTMLImageElement) {
        el.src = selected.originalUrl;
      } else if (el instanceof HTMLVideoElement) {
        el.src = selected.originalUrl;
        el.load();
      }
    }

    // Restore every inline style exactly as it was before editing.
    if (selected.originalStyle) {
      el.setAttribute('style', selected.originalStyle);
    } else {
      el.removeAttribute('style');
    }

    // Restore the editor configuration in memory.
    onChange(cloneEditorConfig(selected.originalConfig));

    setText(selected.originalText);
    setImageUrl(selected.originalUrl);
    setMessage('Modifications annulées.');
    setError('');
    setSelected(null);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await onSave(config);
      setMessage('✓ Enregistré et publié.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        data-vce-ignore="true"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-[2147483000] h-14 w-14 rounded-full bg-[#1c241f] text-[#d4af37] shadow-2xl border border-[#4a5a4c] flex items-center justify-center"
        title="Éditeur visuel"
      >
        <Settings2 size={23} />
      </button>
    );
  }

  return createPortal((
    <>
      {siteEditorMinimized ? (
        <button type="button" data-vce-ignore="true" onClick={() => setSiteEditorMinimized(false)} className="fixed right-5 bottom-5 z-[2147483000] h-14 w-14 rounded-full bg-[#1c241f] text-[#d4af37] shadow-2xl border border-[#4a5a4c] flex items-center justify-center" title="Rouvrir l’éditeur du site">
          <Settings2 size={23} />
        </button>
      ) : (
      <div
        ref={panelRef}
        data-vce-panel="true"
        data-vce-ignore="true"
        style={panelPosition ? { left: panelPosition.x, top: panelPosition.y, right: 'auto', bottom: 'auto' } : undefined}
        className="fixed right-4 bottom-4 z-[2147483000] w-[min(94vw,440px)] max-h-[88vh] overflow-auto rounded-2xl border border-[#536258] bg-[#111613]/98 text-[#f5eedf] shadow-2xl backdrop-blur"
      >
        <div
          onPointerDown={startPanelDrag}
          className="sticky top-0 z-10 flex cursor-grab touch-none select-none items-center justify-between border-b border-[#344139] bg-[#111613] px-4 py-3 active:cursor-grabbing"
          title="Glissez ici pour déplacer l’éditeur"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Move size={16} className="shrink-0 text-[#87968a]" />
            <div className="min-w-0">
              <div className="text-sm font-semibold">Éditeur du site</div>
              <div className="text-[10px] uppercase tracking-[.18em] text-[#87968a]">
                Cliquez un élément de la page
              </div>
            </div>

            {onOpenCustomizer && (
              <button
                type="button"
                onClick={() => onOpenCustomizer?.(editorPage === 'gite' ? 'gite' : 'theme')}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#d4af37]/70 bg-[#263129] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#d4af37] hover:bg-[#334236]"
              >
                <Settings2 size={13} />
                Personnaliser
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {giteFreeformOpen && <button type="button" onClick={() => setSiteEditorMinimized(true)} className="rounded-lg border border-[#455248] px-2 py-1.5 text-[10px] text-[#c4ceb8] hover:border-[#d4af37] hover:text-[#d4af37]">Réduire</button>}
            <button type="button" onClick={() => setOpen(false)} className="p-2 shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <button
            type="button"
            onClick={() => setSelecting(true)}
            className={`w-full rounded-xl px-4 py-3 text-sm font-medium ${selecting ? 'bg-[#d4af37] text-black' : 'bg-[#263129] text-[#f5eedf]'}`}
          >
            <span className="inline-flex items-center gap-2">
              <Type size={16} />
              {selecting ? 'Clique maintenant sur un texte ou une image' : 'Sélectionner un élément'}
            </span>
          </button>

          {selected && (
            <div className="rounded-xl border border-[#39483e] p-3 space-y-4">
              <div className="text-xs text-[#aab6ac]">
                {selected.kind === 'text' ? 'Texte sélectionné' : 'Image sélectionnée'}
              </div>

              {selected.kind === 'text' ? (
                <>
                  <label className="block text-xs">
                    Texte de remplacement
                    <textarea
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        applyTextStyle({ text: e.target.value });
                      }}
                      rows={3}
                      className="mt-1 w-full rounded-lg bg-[#1b231e] border border-[#455248] px-3 py-2 text-sm outline-none"
                    />
                  </label>

                  <label className="block text-xs">
                    Police
                    <select
                      value={font}
                      onChange={(e) => applyTextStyle({ fontFamily: e.target.value })}
                      className="mt-1 w-full rounded-lg bg-[#1b231e] border border-[#455248] px-3 py-2"
                      style={{ fontFamily: font }}
                    >
                      {FONT_OPTIONS.map((name) => (
                        <option key={name} value={name} style={{ fontFamily: name }}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs">
                      Taille
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => applyTextStyle({ fontSize: e.target.value })}
                        className="mt-1 w-full rounded-lg bg-[#1b231e] border border-[#455248] px-3 py-2"
                        placeholder="48px"
                      />
                    </label>

                    <label className="text-xs">
                      Couleur
                      <div className="mt-1 flex gap-2">
                        <input
                          type="color"
                          value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#F5EEDF'}
                          onChange={(e) => applyTextStyle({ color: e.target.value })}
                          className="h-10 w-12 rounded bg-transparent"
                        />
                        <input
                          value={color}
                          onChange={(e) => applyTextStyle({ color: e.target.value })}
                          className="min-w-0 flex-1 rounded-lg bg-[#1b231e] border border-[#455248] px-2"
                        />
                      </div>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <ImageIcon size={18} />
                    <div className="min-w-0 text-xs truncate">{imageUrl || 'Aucune image'}</div>
                  </div>

                  <label className="block rounded-xl border border-dashed border-[#536258] p-4 text-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadImage(file);
                      }}
                    />
                    {uploading ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Import...</span>
                    ) : (
                      <span>Choisir un fichier de remplacement</span>
                    )}
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setLibraryOpen((v) => !v);
                      if (!library.length) void loadLibrary();
                    }}
                    className="w-full rounded-lg bg-[#263129] px-3 py-2 text-sm"
                  >
                    {libraryOpen ? 'Masquer la bibliothèque' : 'Choisir une image existante'}
                  </button>

                  {libraryOpen && (
                    <div className="grid grid-cols-3 gap-2">
                      {libraryLoading ? (
                        <div className="col-span-3 py-4 text-center"><Loader2 className="mx-auto animate-spin" size={18} /></div>
                      ) : library.length ? (
                        library.map((item) => (
                          <button
                            type="button"
                            key={item.url}
                            onClick={() => chooseImage(item.url)}
                            className="aspect-square overflow-hidden rounded-lg border border-[#3c493f] hover:border-[#d4af37]"
                            title={item.pathname || item.url}
                          >
                            <img src={item.url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))
                      ) : (
                        <div className="col-span-3 text-xs text-[#87968a]">Bibliothèque vide.</div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={cancelChanges}
                  className="flex-1 rounded-lg border border-[#7a4a4a] bg-[#2a1d1d] px-3 py-2 text-sm text-[#f1caca] disabled:opacity-50"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <X size={16} /> Annuler
                  </span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                  className="flex-1 rounded-lg bg-[#d4af37] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {saving ? <Loader2 className="mx-auto animate-spin" size={17} /> : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Save size={16} /> Enregistrer
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-[#344139] pt-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#0d120f] p-1 border border-[#344139]">
              <button type="button" onClick={() => setEditorPage('boutique')} className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider ${editorPage === 'boutique' ? 'bg-[#d4af37] text-[#111612]' : 'text-[#a3b1a5] hover:text-white'}`}>🛍️ Boutique</button>
              <button type="button" onClick={() => setEditorPage('gite')} className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider ${editorPage === 'gite' ? 'bg-[#d4af37] text-[#111612]' : 'text-[#a3b1a5] hover:text-white'}`}>🏔️ Gîte</button>
            </div>

            {editorPage === 'boutique' && adminToolbar && (
              <div className="mt-3">
                {adminToolbar}
              </div>
            )}

            {editorPage === 'gite' && (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-[#536258] bg-[#18201a] p-3">
                  <div className="text-sm font-semibold text-[#f3ece0]">Édition directe du Gîte</div>
                  <div className="mt-1 text-[11px] text-[#87968a]">Les éléments Texte, Image, Vidéo et Bouton peuvent être déplacés directement sur la page.</div>
                </div>
                <button type="button" onClick={() => { setGiteFreeformOpen(true); setSiteEditorMinimized(true); }} disabled={!giteConfig || !onGiteChange} className="w-full rounded-xl bg-[#d4af37] px-4 py-3 text-sm font-semibold text-[#111612] disabled:opacity-40">＋ Ouvrir l’éditeur des zones libres</button>
                <button type="button" onClick={() => onOpenCustomizer?.('gite')} className="w-full rounded-xl border border-[#536258] bg-[#263129] px-4 py-3 text-xs font-semibold text-[#e7dfd1]">⚙ Personnalisation complète du Gîte</button>
              </div>
            )}
          </div>

          {floatingMediaOpen && (
            <div data-floating-editor-section="true" className="border-t border-[#344139] pt-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#e8e1d5]">Images flottantes</div>
                  <div className="text-[11px] text-[#87968a]">Ajoutez une image et ancrez-la directement à un module de la page.</div>
                </div>
                {onToggleFloatingMedia && (
                  <button
                    type="button"
                    onClick={onToggleFloatingMedia}
                    className="shrink-0 rounded-lg border border-[#455248] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#c4ceb8] hover:border-[#d4af37] hover:text-[#d4af37]"
                  >
                    Fermer
                  </button>
                )}
              </div>
              <FloatingMediaManager
                config={config}
                onChange={onChange}
              />
            </div>
          )}

          {message && <div className="rounded-lg bg-[#203428] px-3 py-2 text-xs text-[#cfe0d2]"><Check size={14} className="inline mr-1" />{message}</div>}
          {error && <div className="rounded-lg bg-[#3a2222] px-3 py-2 text-xs text-[#f2caca]">{error}</div>}
        </div>
      </div>
      )}
      {giteFreeformOpen && giteConfig && onGiteChange && (
        <GiteFreeformEditor
          value={giteConfig}
          onChange={onGiteChange}
          onSave={onGiteSave}
          onLogout={onLogout}
          onClose={() => { setGiteFreeformOpen(false); setSiteEditorMinimized(false); }}
        />
      )}
    </>),
    document.body,
  );
};

export default SiteVisualEditor;

