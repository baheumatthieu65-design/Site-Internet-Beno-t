import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Settings2,
  Trash2,
  Type,
  Upload,
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
  visible: boolean;
  selector?: string;
  kind?: 'text' | 'media';
}

export interface SiteEditorConfig {
  adminBarPosition: AdminBarPosition;
  blocks: EditorBlock[];
}

interface Props {
  brandData: BrandConfig;
  config: SiteEditorConfig;
  onChange: (config: SiteEditorConfig) => void;
  onSave: () => Promise<void> | void;
}

const textTags = new Set(['H1','H2','H3','H4','H5','H6','P','SPAN','BUTTON','A','LABEL','LI','SMALL','STRONG','EM']);

const cssPath = (element: HTMLElement) => {
  if (element.id) return `#${CSS.escape(element.id)}`;
  const parts: string[] = [];
  let node: HTMLElement | null = element;
  while (node && node !== document.body && parts.length < 8) {
    let part = node.tagName.toLowerCase();
    const classes = Array.from(node.classList).filter((c) => !c.includes(':')).slice(0, 2);
    if (classes.length) part += '.' + classes.map((c) => CSS.escape(c)).join('.');
    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((child) => child.tagName === node!.tagName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(' > ');
};

const applySavedBlocks = (blocks: EditorBlock[]) => {
  blocks.forEach((block) => {
    if (!block.selector) return;
    let el: Element | null = null;
    try { el = document.querySelector(block.selector); } catch { return; }
    if (!el) return;

    const element = el as HTMLElement;
    if (block.kind === 'media' || block.type === 'image' || block.type === 'video') {
      if (element instanceof HTMLImageElement && block.url) element.src = block.url;
      if (element instanceof HTMLVideoElement && block.url) element.src = block.url;
    } else if (block.text != null && element.textContent !== block.text) {
      element.textContent = block.text;
    }
  });
};

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
  if (position === 'top') { bar.style.top='0'; bar.style.left='0'; bar.style.right='0'; bar.style.width='100%'; }
  if (position === 'bottom') { bar.style.bottom='0'; bar.style.left='0'; bar.style.right='0'; bar.style.width='100%'; }
  if (position === 'left') { bar.style.top='50%'; bar.style.left='0'; bar.style.width='min(92vw,420px)'; bar.style.transform='translateY(-50%)'; }
  if (position === 'right') { bar.style.top='50%'; bar.style.right='0'; bar.style.width='min(92vw,420px)'; bar.style.transform='translateY(-50%)'; }
};

export const SiteVisualEditor: React.FC<Props> = ({ config, onChange, onSave }) => {
  const [open, setOpen] = useState(false);
  const [directEdit, setDirectEdit] = useState(false);
  const [selected, setSelected] = useState<{ element: HTMLElement; type: 'text'|'media' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    applyAdminBarPosition(config.adminBarPosition || 'top');
    applySavedBlocks(config.blocks);
  }, [config.adminBarPosition, config.blocks]);

  useEffect(() => {
    if (!directEdit) return;
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest('#site-visual-editor-panel') || target.closest('#admin-top-bar')) return;
      const media = target.closest('img, video') as HTMLElement | null;
      const text = target.closest('h1,h2,h3,h4,h5,h6,p,span,button,a,label,li,small,strong,em') as HTMLElement | null;
      const element = media || text;
      if (!element || !textTags.has(element.tagName) && !media) return;
      event.preventDefault();
      event.stopPropagation();
      setSelected({ element, type: media ? 'media' : 'text' });
      if (media) {
        setMessage('Image/vidéo sélectionnée : choisissez un fichier.');
      } else {
        element.contentEditable = 'true';
        element.focus();
        const range = document.createRange();
        range.selectNodeContents(element);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        setMessage('Modifiez le texte directement puis cliquez ailleurs.');
      }
    };
    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, [directEdit]);

  useEffect(() => {
    if (!directEdit) return;
    const blur = (event: FocusEvent) => {
      const element = event.target as HTMLElement | null;
      if (!element?.isContentEditable) return;
      const selector = cssPath(element);
      const blocks = config.blocks.filter((b) => b.selector !== selector);
      blocks.push({
        id: `text-${Date.now()}`,
        type: element.tagName.startsWith('H') ? 'heading' : element.tagName === 'BUTTON' ? 'button' : 'text',
        section: 'hero',
        x: 50, y: 50,
        text: element.textContent || '',
        visible: true,
        selector,
        kind: 'text',
      });
      onChange({ ...config, blocks });
      element.contentEditable = 'false';
      setSelected(null);
    };
    document.addEventListener('blur', blur, true);
    return () => document.removeEventListener('blur', blur, true);
  }, [directEdit, config, onChange]);

  const update = (patch: Partial<SiteEditorConfig>) => onChange({ ...config, ...patch });

  const add = (type: EditorBlock['type']) => {
    update({ blocks: [...config.blocks, {
      id: `block-${Date.now()}`, type, section: 'hero', x: 50, y: 55,
      text: type === 'button' ? 'Nouveau bouton' : type === 'heading' ? 'Nouveau titre' : 'Nouveau texte',
      url: type === 'button' ? '#' : undefined, visible: true,
    }]});
  };

  const handleUpload = async (file: File) => {
    setUploading(true); setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/site-media', { method: 'POST', credentials: 'include', body });
      const data = await response.json();
      if (!response.ok || !data?.url) throw new Error(data?.error || `Upload HTTP ${response.status}`);
      if (!selected) throw new Error('Aucun média sélectionné.');
      const selector = cssPath(selected.element);
      const blocks = config.blocks.filter((b) => b.selector !== selector);
      blocks.push({
        id: `media-${Date.now()}`,
        type: selected.element instanceof HTMLVideoElement ? 'video' : 'image',
        section: 'hero', x: 50, y: 50, url: data.url, visible: true, selector, kind: 'media'
      });
      onChange({ ...config, blocks });
      if (selected.element instanceof HTMLImageElement) selected.element.src = data.url;
      if (selected.element instanceof HTMLVideoElement) selected.element.src = data.url;
      setMessage('Média remplacé. Cliquez sur Enregistrer.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload impossible.');
    } finally { setUploading(false); }
  };

  const save = async () => {
    setSaving(true); setError(null); setMessage(null);
    try { await onSave(); setMessage('Modifications enregistrées.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Impossible d’enregistrer.'); }
    finally { setSaving(false); }
  };

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-[2000] rounded-full bg-[#d4af37] text-black p-3 shadow-2xl cursor-pointer hover:scale-105 transition-transform" title="Ouvrir l’éditeur visuel">
      <Settings2 className="w-5 h-5" />
    </button>
  );

  return (
    <aside id="site-visual-editor-panel" className="fixed bottom-4 right-4 z-[2000] w-[min(460px,calc(100vw-2rem))] max-h-[88vh] overflow-hidden rounded-2xl bg-[#111711] text-white border border-[#d4af37]/70 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#334236] bg-[#172019]">
        <div><strong className="text-[#d4af37] block">Éditeur visuel</strong><span className="text-[10px] text-[#9aaa9d]">Modifiez directement la page</span></div>
        <button type="button" onClick={() => { setOpen(false); setDirectEdit(false); setSelected(null); }} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"><X className="w-5 h-5" /></button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[calc(88vh-126px)] space-y-4">
        <button type="button" onClick={() => { setDirectEdit((v) => !v); setMessage(null); }} className={`w-full rounded-lg py-3 font-bold cursor-pointer border ${directEdit ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-[#263329] text-white border-[#405044]'}`}>
          <Type className="inline w-4 h-4 mr-2" /> {directEdit ? 'Mode édition directe : ACTIVÉ' : 'Modifier directement sur la page'}
        </button>

        <div>
          <label className="text-xs block mb-1 text-[#c4ceb8]">Position de la barre administrateur</label>
          <select value={config.adminBarPosition || 'top'} onChange={(e) => { const p=e.target.value as AdminBarPosition; update({adminBarPosition:p}); requestAnimationFrame(()=>applyAdminBarPosition(p)); }} className="w-full rounded-lg bg-[#1c261e] border border-[#405044] px-3 py-2 text-white cursor-pointer">
            <option value="top">Haut</option><option value="bottom">Bas</option><option value="left">Gauche</option><option value="right">Droite</option>
          </select>
        </div>

        {directEdit && (
          <div className="rounded-lg bg-[#202922] border border-[#d4af37]/50 p-3 text-xs text-[#e8dfd0]">
            Cliquez sur un texte de la page pour l'éditer. Cliquez sur une image pour la remplacer.
          </div>
        )}

        {selected?.type === 'media' && (
          <div className="rounded-lg border border-[#d4af37]/60 p-3">
            <div className="text-xs mb-2 text-[#d4af37]">Média sélectionné</div>
            <input ref={fileInputRef} type="file" accept="image/*,image/gif,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => e.target.files?.[0] && void handleUpload(e.target.files[0])} />
            <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="w-full rounded-lg bg-[#d4af37] text-black font-bold py-2 cursor-pointer disabled:opacity-60">
              {uploading ? <><Loader2 className="inline w-4 h-4 mr-1 animate-spin" />Upload...</> : <><Upload className="inline w-4 h-4 mr-1" />Choisir un fichier</>}
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => add('text')} className="rounded-lg bg-[#263329] p-2 text-xs cursor-pointer"><Plus className="inline w-3 h-3" /> Texte</button>
          <button type="button" onClick={() => add('heading')} className="rounded-lg bg-[#263329] p-2 text-xs cursor-pointer"><Plus className="inline w-3 h-3" /> Titre</button>
          <button type="button" onClick={() => add('button')} className="rounded-lg bg-[#263329] p-2 text-xs cursor-pointer"><Plus className="inline w-3 h-3" /> Bouton</button>
        </div>

        {config.blocks.filter((b) => b.selector).map((block) => (
          <div key={block.id} className="flex items-center gap-2 rounded-lg border border-[#334236] p-2">
            <div className="min-w-0 flex-1 text-xs truncate">{block.kind === 'media' ? <><ImageIcon className="inline w-3 h-3 mr-1" /> Média</> : block.text || 'Texte'}</div>
            <button type="button" onClick={() => update({blocks: config.blocks.filter((b) => b.id !== block.id)})} className="text-red-300 cursor-pointer p-1"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <div className="border-t border-[#334236] bg-[#172019] p-3">
        {error && <div className="mb-2 rounded-lg bg-red-950/50 border border-red-800/60 px-3 py-2 text-xs text-red-200">{error}</div>}
        {message && <div className="mb-2 rounded-lg bg-emerald-950/40 border border-emerald-700/60 px-3 py-2 text-xs text-emerald-200"><Check className="inline w-3.5 h-3.5 mr-1" />{message}</div>}
        <button type="button" disabled={saving} onClick={() => void save()} className="w-full rounded-lg bg-[#d4af37] text-black font-bold py-3 cursor-pointer disabled:opacity-60">
          {saving ? <><Loader2 className="inline w-4 h-4 mr-1 animate-spin" />Enregistrement...</> : <><Save className="inline w-4 h-4 mr-1" />Enregistrer les modifications</>}
        </button>
      </div>
    </aside>
  );
};
