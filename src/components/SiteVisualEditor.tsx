import React, { useEffect, useMemo, useState } from 'react';
import { Check, Image as ImageIcon, Loader2, Save, Settings2, Type, X } from 'lucide-react';
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

function selectorFor(el: Element): string {
  const explicit = el.getAttribute('data-vce-selector');
  if (explicit) return `[data-vce-selector="${esc(explicit)}"]`;

  const heroLine = el.getAttribute('data-vce-hero-line');
  if (heroLine) return `[data-vce-hero-line="${esc(heroLine)}"]`;

  const role = el.getAttribute('data-vce-role');
  if (role) return `[data-vce-role="${esc(role)}"]`;

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body && parts.length < 8) {
    const parent = current.parentElement;
    const tag = current.tagName.toLowerCase();

    if (!parent) {
      parts.unshift(tag);
      break;
    }

    const same = Array.from(parent.children).filter(
      (child) => child.tagName === current!.tagName,
    );
    const index = same.indexOf(current) + 1;
    parts.unshift(`${tag}:nth-of-type(${index})`);

    const candidate = parts.join(' > ');
    try {
      if (document.querySelectorAll(candidate).length === 1) return candidate;
    } catch {
      // Continue building a more specific selector.
    }

    current = parent;
  }

  return parts.join(' > ');
}

function readableText(el: Element) {
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

function isText(el: Element) {
  const tag = el.tagName.toLowerCase();
  if (['script', 'style', 'svg', 'path', 'option'].includes(tag)) return false;
  if (el.closest('[data-vce-ignore="true"]')) return false;
  if (el.closest('[data-vce-panel="true"]')) return false;
  return readableText(el).length > 0;
}

function applyBar(position: AdminBarPosition) {
  const bar = document.getElementById('admin-top-bar');
  if (!bar) return;

  Object.assign(bar.style, {
    position: 'fixed',
    zIndex: '1000',
    margin: '0',
    transform: '',
    top: 'auto',
    bottom: 'auto',
    left: 'auto',
    right: 'auto',
    width: '',
  });

  if (position === 'top') Object.assign(bar.style, { top: '0', left: '0', right: '0', width: '100%' });
  if (position === 'bottom') Object.assign(bar.style, { bottom: '0', left: '0', right: '0', width: '100%' });
  if (position === 'left') Object.assign(bar.style, { top: '50%', left: '0', width: 'min(92vw, 420px)', transform: 'translateY(-50%)' });
  if (position === 'right') Object.assign(bar.style, { top: '50%', right: '0', width: 'min(92vw, 420px)', transform: 'translateY(-50%)' });
}

export const SiteVisualEditor: React.FC<Props> = ({ config, onChange, onSave }) => {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<{
    selector: string;
    element: Element;
    kind: 'text' | 'media';
    originalText: string;
    originalUrl: string;
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
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    link.dataset.vceFonts = 'true';
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  useEffect(() => {
    if (open) applyBar(config.adminBarPosition || 'top');
  }, [open, config.adminBarPosition]);

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

        setSelected({
          selector: selectorFor(media),
          element: media,
          kind: 'media',
          originalText: '',
          originalUrl: url,
        });
        setImageUrl(url);
        setSelecting(false);
        return;
      }

      if (isText(element)) {
        const style = getComputedStyle(element);
        setSelected({
          selector: selectorFor(element),
          element,
          kind: 'text',
          originalText: readableText(element),
          originalUrl: '',
        });
        setText(readableText(element));
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
    () => selected ? config.blocks.findIndex((b) => b.selector === selected.selector) : -1,
    [config.blocks, selected],
  );

  const commitBlock = (patch: Partial<EditorBlock>) => {
    if (!selected) return config;

    const blocks = [...config.blocks];
    const existing: EditorBlock = blockIndex >= 0
      ? blocks[blockIndex]
      : {
          id: `element-${Date.now()}`,
          type: selected.kind === 'media' ? 'image' : 'text',
          section: 'hero',
          x: 50,
          y: 50,
          visible: true,
          selector: selected.selector,
          kind: selected.kind,
        };

    const nextBlock = { ...existing, ...patch };
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
      selector: selected.selector,
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
      selector: selected.selector,
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
      const form = new FormData();
      form.append('file', file);

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
        className="fixed right-5 bottom-5 z-[1100] h-14 w-14 rounded-full bg-[#1c241f] text-[#d4af37] shadow-2xl border border-[#4a5a4c] flex items-center justify-center"
        title="Éditeur visuel"
      >
        <Settings2 size={23} />
      </button>
    );
  }

  return (
    <>
      <div
        data-vce-panel="true"
        data-vce-ignore="true"
        className="fixed right-4 bottom-4 z-[1100] w-[min(94vw,440px)] max-h-[88vh] overflow-auto rounded-2xl border border-[#536258] bg-[#111613]/98 text-[#f5eedf] shadow-2xl backdrop-blur"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#344139] bg-[#111613] px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Éditeur du site</div>
            <div className="text-[10px] uppercase tracking-[.18em] text-[#87968a]">
              Cliquez un élément de la page
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="p-2">
            <X size={18} />
          </button>
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
                  onClick={() => setSelected(null)}
                  className="flex-1 rounded-lg border border-[#455248] px-3 py-2 text-sm"
                >
                  Désélectionner
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                  className="flex-1 rounded-lg bg-[#d4af37] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {saving ? <Loader2 className="mx-auto animate-spin" size={17} /> : (
                    <span className="inline-flex items-center gap-2"><Save size={16} /> Enregistrer et publier</span>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-[#344139] pt-4">
            <div className="text-xs text-[#87968a] mb-2">Position du bandeau</div>
            <div className="grid grid-cols-4 gap-2">
              {(['top', 'bottom', 'left', 'right'] as AdminBarPosition[]).map((position) => (
                <button
                  type="button"
                  key={position}
                  onClick={() => {
                    const next = { ...config, adminBarPosition: position };
                    onChange(next);
                    applyBar(position);
                  }}
                  className={`rounded-lg px-2 py-2 text-xs ${config.adminBarPosition === position ? 'bg-[#d4af37] text-black' : 'bg-[#263129]'}`}
                >
                  {position}
                </button>
              ))}
            </div>
          </div>

          {message && <div className="rounded-lg bg-[#203428] px-3 py-2 text-xs text-[#cfe0d2]"><Check size={14} className="inline mr-1" />{message}</div>}
          {error && <div className="rounded-lg bg-[#3a2222] px-3 py-2 text-xs text-[#f2caca]">{error}</div>}
        </div>
      </div>
    </>
  );
};

export default SiteVisualEditor;
