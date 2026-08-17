import React, { useEffect, useRef, useState } from 'react';
import {
  Check, Image as ImageIcon, Loader2, Move, Plus, Save, Settings2,
  Trash2, Type, Upload, X,
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
  link?: string;
  fontFamily?: string;
  fontSize?: string;
}

export interface SiteEditorConfig {
  adminBarPosition: AdminBarPosition;
  blocks: EditorBlock[];
}

interface Props {
  brandData: BrandConfig;
  config: SiteEditorConfig;
  onChange: (config: SiteEditorConfig) => void;
  onSave: (config?: SiteEditorConfig) => Promise<void> | void;
}

interface LibraryItem { url: string; pathname?: string; size?: number; uploadedAt?: string; }

const FONT_OPTIONS = [
  ['Inter', 'Inter, Arial, sans-serif'],
  ['Arial', 'Arial, sans-serif'],
  ['Helvetica', 'Helvetica, Arial, sans-serif'],
  ['Verdana', 'Verdana, sans-serif'],
  ['Tahoma', 'Tahoma, sans-serif'],
  ['Trebuchet MS', '"Trebuchet MS", sans-serif'],
  ['Georgia', 'Georgia, serif'],
  ['Times New Roman', '"Times New Roman", serif'],
  ['Garamond', 'Garamond, "Times New Roman", serif'],
  ['Palatino', '"Palatino Linotype", Palatino, serif'],
  ['Book Antiqua', '"Book Antiqua", Palatino, serif'],
  ['Baskerville', 'Baskerville, Georgia, serif'],
  ['Courier New', '"Courier New", monospace'],
  ['Lucida Console', '"Lucida Console", monospace'],
  ['Impact', 'Impact, sans-serif'],
  ['Arial Black', '"Arial Black", sans-serif'],
  ['Comic Sans MS', '"Comic Sans MS", cursive'],
  ['System UI', 'system-ui, sans-serif'],
  ['Serif classique', 'serif'],
  ['Sans-serif classique', 'sans-serif'],
];

const FONT_SIZES = ['12px','14px','16px','18px','20px','22px','24px','28px','32px','36px','40px','48px','56px','64px','72px','80px','96px'];

const textTags = new Set(['H1','H2','H3','H4','H5','H6','P','SPAN','BUTTON','A','LABEL','LI','SMALL','STRONG','EM']);

const findEditableText = (target: HTMLElement | null) => {
  if (!target) return null;
  const known = target.closest('h1,h2,h3,h4,h5,h6,p,span,button,a,label,li,small,strong,em') as HTMLElement | null;
  if (known && textTags.has(known.tagName)) return known;
  let node: HTMLElement | null = target;
  while (node && node !== document.body) {
    const hasDirectText = Array.from(node.childNodes).some(c => c.nodeType === Node.TEXT_NODE && Boolean(c.textContent?.trim()));
    if (hasDirectText && Array.from(node.children).length <= 1) return node;
    node = node.parentElement;
  }
  return null;
};

const cssPath = (element: HTMLElement) => {
  if (element.id) return `#${CSS.escape(element.id)}`;
  const parts: string[] = [];
  let node: HTMLElement | null = element;
  while (node && node !== document.body && parts.length < 10) {
    let part = node.tagName.toLowerCase();
    const classes = Array.from(node.classList).filter(c => !c.includes(':')).slice(0, 2);
    if (classes.length) part += '.' + classes.map(c => CSS.escape(c)).join('.');
    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => child.tagName === node!.tagName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(' > ');
};

const applySavedOverrides = (blocks: EditorBlock[]) => {
  blocks.forEach(block => {
    if (!block.selector) return;
    let el: Element | null = null;
    try { el = document.querySelector(block.selector); } catch { return; }
    if (!el) return;
    const element = el as HTMLElement;
    if (block.kind === 'media' && block.url) {
      if (element instanceof HTMLImageElement) element.src = block.url;
      if (element instanceof HTMLVideoElement) { element.src = block.url; element.load(); }
    }
    if (block.kind === 'text') {
      if (block.text != null) element.textContent = block.text;
      if (block.fontFamily) element.style.fontFamily = block.fontFamily;
      if (block.fontSize) element.style.fontSize = block.fontSize;
    }
  });
};

const applyAdminBarPosition = (position: AdminBarPosition) => {
  const bar = document.getElementById('admin-top-bar');
  if (!bar) return;
  bar.style.position = 'fixed'; bar.style.zIndex = '1000'; bar.style.margin = '0'; bar.style.transform = '';
  bar.style.top = 'auto'; bar.style.bottom = 'auto'; bar.style.left = 'auto'; bar.style.right = 'auto';
  if (position === 'top') { bar.style.top='0'; bar.style.left='0'; bar.style.right='0'; bar.style.width='100%'; }
  else if (position === 'bottom') { bar.style.bottom='0'; bar.style.left='0'; bar.style.right='0'; bar.style.width='100%'; }
  else if (position === 'left') { bar.style.top='50%'; bar.style.left='0'; bar.style.width='min(92vw,420px)'; bar.style.transform='translateY(-50%)'; }
  else { bar.style.top='50%'; bar.style.right='0'; bar.style.width='min(92vw,420px)'; bar.style.transform='translateY(-50%)'; }
};

export const SiteVisualEditor: React.FC<Props> = ({ config, onChange, onSave }) => {
  const [open, setOpen] = useState(false);
  const [directEdit, setDirectEdit] = useState(false);
  const [addMode, setAddMode] = useState<EditorBlock['type'] | null>(null);
  const [selected, setSelected] = useState<{ element: HTMLElement; type: 'text'|'media' } | null>(null);
  const [currentText, setCurrentText] = useState('');
  const [replacementText, setReplacementText] = useState('');
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0][1]);
  const [fontSize, setFontSize] = useState('16px');
  const [newText, setNewText] = useState('Nouveau texte');
  const [newLink, setNewLink] = useState('#');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    applyAdminBarPosition(config.adminBarPosition || 'top');
    applySavedOverrides(config.blocks);
  }, [config.adminBarPosition, config.blocks]);

  useEffect(() => {
    if (!directEdit && !addMode) return;
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest('#site-visual-editor-panel') || target.closest('#admin-top-bar') || target.closest('#main-nav-header') || target.closest('[data-vce-ignore="true"]')) return;
      const hero = document.getElementById('hero-section');
      const media = target.closest('img, video') as HTMLElement | null;
      const text = findEditableText(target);

      if (addMode) {
        if (!hero) { setError('La section Accueil est introuvable.'); return; }
        const rect = hero.getBoundingClientRect();
        const x = Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(4, Math.min(96, ((event.clientY - rect.top) / rect.height) * 100));
        if (addMode === 'image' || addMode === 'video') {
          (window as any).__vcePendingPlacement = { x, y, type: addMode };
          addFileRef.current?.click(); return;
        }
        const type = addMode;
        const block: EditorBlock = { id:`block-${Date.now()}`, type, section:'hero', x, y, text:newText || (type==='button'?'Nouveau bouton':'Nouveau texte'), link:type==='button'?newLink||'#':undefined, visible:true, fontFamily, fontSize };
        onChange({ ...config, blocks:[...config.blocks, block] });
        setAddMode(null); setMessage('Bloc ajouté. Cliquez sur Enregistrer pour publier.'); event.preventDefault(); event.stopPropagation(); return;
      }

      const element = media || text;
      if (!element) return;
      event.preventDefault(); event.stopPropagation();
      if (media) {
        setSelected({ element, type:'media' });
        setMessage('Média sélectionné.');
      } else {
        const selector = cssPath(element);
        const saved = config.blocks.find(b => b.selector === selector && b.kind === 'text');
        const computed = window.getComputedStyle(element);
        setSelected({ element, type:'text' });
        setCurrentText(element.textContent || '');
        setReplacementText(saved?.text ?? element.textContent ?? '');
        setFontFamily(saved?.fontFamily ?? computed.fontFamily);
        setFontSize(saved?.fontSize ?? computed.fontSize);
        setMessage('Texte sélectionné. Modifiez-le dans le panneau puis enregistrez.');
      }
    };
    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, [directEdit, addMode, config, newText, newLink, fontFamily, fontSize, onChange]);

  const update = (patch: Partial<SiteEditorConfig>) => onChange({ ...config, ...patch });

  const buildTextSaveConfig = () => {
    if (!selected || selected.type !== 'text') return config;
    const selector = cssPath(selected.element);
    const blocks = config.blocks.filter(b => b.selector !== selector);
    blocks.push({
      id:`text-${Date.now()}`, type:selected.element.tagName.startsWith('H')?'heading':selected.element.tagName==='BUTTON'?'button':'text', section:'hero', x:50, y:50,
      text:replacementText, visible:true, selector, kind:'text', fontFamily, fontSize,
    });
    selected.element.textContent = replacementText;
    selected.element.style.fontFamily = fontFamily;
    selected.element.style.fontSize = fontSize;
    return { ...config, blocks };
  };

  const save = async () => {
    setSaving(true); setError(null); setMessage(null);
    try {
      const nextConfig = selected?.type === 'text' ? buildTextSaveConfig() : config;
      await onSave(nextConfig);
      if (selected?.type === 'text') {
        setCurrentText(replacementText);
        setSelected(null);
      }
      setMessage('Modifications enregistrées et appliquées.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’enregistrer.');
    } finally { setSaving(false); }
  };

  const upload = async (file: File, placement?: {x:number;y:number;type:'image'|'video'}) => {
    setUploading(true); setError(null);
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/site-media', { method:'POST', credentials:'include', body });
      const data = await response.json();
      if (!response.ok || !data?.url) throw new Error(data?.error || `Upload HTTP ${response.status}`);
      if (placement) {
        update({ blocks:[...config.blocks,{ id:`block-${Date.now()}`, type:placement.type, section:'hero', x:placement.x, y:placement.y, url:data.url, visible:true }] });
        setMessage('Média ajouté. Cliquez sur Enregistrer.');
      } else if (selected) {
        const selector = cssPath(selected.element);
        const blocks = config.blocks.filter(b=>b.selector!==selector);
        blocks.push({ id:`media-${Date.now()}`, type:selected.element instanceof HTMLVideoElement?'video':'image', section:'hero', x:50,y:50,url:data.url,visible:true,selector,kind:'media' });
        update({ blocks });
        if (selected.element instanceof HTMLImageElement) selected.element.src=data.url;
        if (selected.element instanceof HTMLVideoElement) { selected.element.src=data.url; selected.element.load(); }
        setSelected(null); setMessage('Média remplacé. Cliquez sur Enregistrer.');
      }
      setAddMode(null);
    } catch(err) { setError(err instanceof Error?err.message:'Upload impossible.'); }
    finally { setUploading(false); }
  };

  const handleAddFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0]; event.target.value='';
    const pending=(window as any).__vcePendingPlacement as {x:number;y:number;type:'image'|'video'}|undefined;
    if(file&&pending){delete (window as any).__vcePendingPlacement; void upload(file,pending);}
  };

  const loadLibrary = async () => {
    try { const r=await fetch('/api/site-media',{credentials:'include'}); const d=await r.json(); if(!r.ok) throw new Error(d?.error||`HTTP ${r.status}`); setLibrary(Array.isArray(d?.items)?d.items:[]); setLibraryOpen(true); }
    catch(err){setError(err instanceof Error?err.message:'Bibliothèque indisponible.');}
  };

  const chooseLibraryItem = (item: LibraryItem) => {
    if(!selected) return;
    const selector=cssPath(selected.element); const isVideo=/\.(mp4|webm|mov)(\?|$)/i.test(item.url);
    const blocks=config.blocks.filter(b=>b.selector!==selector);
    blocks.push({id:`media-${Date.now()}`,type:isVideo?'video':'image',section:'hero',x:50,y:50,url:item.url,visible:true,selector,kind:'media'});
    update({blocks});
    if(selected.element instanceof HTMLImageElement) selected.element.src=item.url;
    if(selected.element instanceof HTMLVideoElement){selected.element.src=item.url;selected.element.load();}
    setLibraryOpen(false);setSelected(null);setMessage('Média remplacé depuis la bibliothèque. Cliquez sur Enregistrer.');
  };

  const removeBlock=(id:string)=>update({blocks:config.blocks.filter(b=>b.id!==id)});

  if(!open) return <button type="button" data-vce-ignore="true" onClick={()=>setOpen(true)} className="fixed bottom-4 right-4 z-[2000] rounded-full bg-[#d4af37] text-black p-3 shadow-2xl cursor-pointer hover:scale-105 transition-transform" title="Ouvrir l’éditeur visuel"><Settings2 className="w-5 h-5"/></button>;

  return <>
    <div id="site-visual-editor-panel" data-vce-ignore="true" className="fixed bottom-4 right-4 z-[2000] w-[min(500px,calc(100vw-2rem))] max-h-[90vh] overflow-hidden rounded-2xl bg-[#111711] text-white border border-[#d4af37]/70 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#334236] bg-[#172019]"><div><strong className="text-[#d4af37] block">Éditeur visuel V6</strong><span className="text-[10px] text-[#9aaa9d]">Cliquez sur un texte pour le modifier</span></div><button type="button" onClick={()=>{setOpen(false);setDirectEdit(false);setAddMode(null);setSelected(null);}} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"><X className="w-5 h-5"/></button></div>
      <div className="p-4 overflow-y-auto max-h-[calc(90vh-128px)] space-y-3">
        <button type="button" data-vce-ignore="true" onClick={()=>{setDirectEdit(v=>!v);setAddMode(null);setSelected(null);setMessage(null);}} className={`w-full rounded-lg py-3 font-bold cursor-pointer border ${directEdit?'bg-[#d4af37] text-black border-[#d4af37]':'bg-[#263329] text-white border-[#405044]'}`}><Type className="inline w-4 h-4 mr-2"/>{directEdit?'Mode sélection de texte : ACTIVÉ':'✏️ Modifier directement la page'}</button>

        {selected?.type==='text' && <div className="rounded-xl border border-[#d4af37]/70 bg-[#182119] p-3 space-y-3">
          <div className="text-sm font-bold text-[#d4af37]">Texte sélectionné</div>
          <div><label className="block text-[10px] uppercase tracking-wider text-[#94a395] mb-1">Texte actuel</label><textarea value={currentText} readOnly rows={2} className="w-full rounded-lg bg-[#0b100c] border border-[#344437] px-3 py-2 text-xs text-[#aeb8af] resize-none"/></div>
          <div><label className="block text-[10px] uppercase tracking-wider text-[#94a395] mb-1">Nouveau texte</label><textarea value={replacementText} onChange={e=>setReplacementText(e.target.value)} rows={3} className="w-full rounded-lg bg-[#0b100c] border border-[#d4af37]/60 px-3 py-2 text-sm text-white resize-y" placeholder="Écrivez le texte de remplacement ici..."/></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] uppercase tracking-wider text-[#94a395] mb-1">Police</label><select value={fontFamily} onChange={e=>setFontFamily(e.target.value)} className="w-full rounded-lg bg-[#0b100c] border border-[#405044] px-2 py-2 text-xs text-white">{FONT_OPTIONS.map(([label,value])=><option key={value} value={value}>{label}</option>)}</select></div>
            <div><label className="block text-[10px] uppercase tracking-wider text-[#94a395] mb-1">Taille</label><select value={fontSize} onChange={e=>setFontSize(e.target.value)} className="w-full rounded-lg bg-[#0b100c] border border-[#405044] px-2 py-2 text-xs text-white">{FONT_SIZES.map(size=><option key={size} value={size}>{size}</option>)}</select></div>
          </div>
          <div className="rounded-lg bg-[#0b100c] border border-[#344437] p-3"><div className="text-[10px] text-[#94a395] mb-1">Aperçu</div><div style={{fontFamily,fontSize}} className="text-[#f3ece0] break-words">{replacementText || 'Votre nouveau texte apparaîtra ici.'}</div></div>
        </div>}

        {selected?.type==='media' && <div className="rounded-lg border border-[#d4af37]/60 p-3 space-y-2"><div className="text-xs text-[#d4af37]">Média sélectionné</div><input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value='';}}/><div className="grid grid-cols-2 gap-2"><button type="button" disabled={uploading} onClick={()=>fileInputRef.current?.click()} className="rounded-lg bg-[#d4af37] text-black font-bold py-2 cursor-pointer disabled:opacity-60">{uploading?<Loader2 className="inline w-4 h-4 animate-spin"/>:<Upload className="inline w-4 h-4 mr-1"/>}Importer</button><button type="button" onClick={loadLibrary} className="rounded-lg bg-[#263329] py-2 cursor-pointer"><ImageIcon className="inline w-4 h-4 mr-1"/>Bibliothèque</button></div></div>}

        <div><label className="text-xs block mb-1 text-[#c4ceb8]">Position de la barre administrateur</label><select value={config.adminBarPosition||'top'} onChange={e=>{const p=e.target.value as AdminBarPosition;update({adminBarPosition:p});requestAnimationFrame(()=>applyAdminBarPosition(p));}} className="w-full rounded-lg bg-[#1c261e] border border-[#405044] px-3 py-2 text-white cursor-pointer"><option value="top">Haut</option><option value="bottom">Bas</option><option value="left">Gauche</option><option value="right">Droite</option></select></div>
        <div className="grid grid-cols-2 gap-2"><input value={newText} onChange={e=>setNewText(e.target.value)} placeholder="Texte du nouveau bloc" className="rounded-lg bg-[#0d120e] border border-[#405044] px-3 py-2 text-xs"/><input value={newLink} onChange={e=>setNewLink(e.target.value)} placeholder="Lien du bouton" className="rounded-lg bg-[#0d120e] border border-[#405044] px-3 py-2 text-xs"/></div>
        <div className="grid grid-cols-4 gap-2"><button type="button" onClick={()=>{setAddMode('text');setDirectEdit(false);setMessage('Cliquez à l’endroit où placer le texte.');}} className="rounded-lg bg-[#263329] p-2 text-xs cursor-pointer"><Plus className="inline w-3 h-3"/>Texte</button><button type="button" onClick={()=>{setAddMode('heading');setDirectEdit(false);setMessage('Cliquez à l’endroit où placer le titre.');}} className="rounded-lg bg-[#263329] p-2 text-xs cursor-pointer"><Plus className="inline w-3 h-3"/>Titre</button><button type="button" onClick={()=>{setAddMode('button');setDirectEdit(false);setMessage('Cliquez à l’endroit où placer le bouton.');}} className="rounded-lg bg-[#263329] p-2 text-xs cursor-pointer"><Plus className="inline w-3 h-3"/>Bouton</button><button type="button" onClick={()=>{setAddMode('image');setDirectEdit(false);setMessage('Cliquez à l’endroit où placer le média.');}} className="rounded-lg bg-[#263329] p-2 text-xs cursor-pointer"><ImageIcon className="inline w-3 h-3"/>Média</button></div>
        <input ref={addFileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleAddFile}/>

        <div className="rounded-lg border border-[#334236] p-3"><div className="flex items-center gap-2 mb-2 text-xs text-[#c4ceb8]"><Move className="w-3.5 h-3.5 text-[#d4af37]"/>Blocs ajoutés</div>{config.blocks.filter(b=>!b.selector).map(block=><div key={block.id} className="border border-[#405044] rounded-lg p-2 mb-2"><div className="flex gap-2 items-center"><input value={block.text||''} onChange={e=>update({blocks:config.blocks.map(b=>b.id===block.id?{...b,text:e.target.value}:b)})} className="flex-1 min-w-0 bg-[#0c110d] border border-[#354437] rounded px-2 py-1 text-xs"/><button type="button" onClick={()=>removeBlock(block.id)} className="text-red-300 p-1 cursor-pointer"><Trash2 className="w-4 h-4"/></button></div><div className="grid grid-cols-2 gap-2 mt-2 text-[10px]"><label>X {Math.round(block.x)}%<input type="range" min="0" max="100" value={block.x} onChange={e=>update({blocks:config.blocks.map(b=>b.id===block.id?{...b,x:Number(e.target.value)}:b)})} className="w-full cursor-pointer"/></label><label>Y {Math.round(block.y)}%<input type="range" min="0" max="100" value={block.y} onChange={e=>update({blocks:config.blocks.map(b=>b.id===block.id?{...b,y:Number(e.target.value)}:b)})} className="w-full cursor-pointer"/></label></div></div>)}</div>
        {message&&<div className="rounded-lg bg-emerald-950/40 border border-emerald-700/60 px-3 py-2 text-xs text-emerald-200"><Check className="inline w-3.5 h-3.5 mr-1"/>{message}</div>}{error&&<div className="rounded-lg bg-red-950/50 border border-red-800/60 px-3 py-2 text-xs text-red-200">{error}</div>}
      </div>
      <div className="border-t border-[#334236] bg-[#172019] p-3"><button type="button" disabled={saving} onClick={save} className="w-full rounded-lg bg-[#d4af37] text-black font-bold py-3 cursor-pointer disabled:opacity-60">{saving?<><Loader2 className="inline w-4 h-4 mr-1 animate-spin"/>Enregistrement...</>:<><Save className="inline w-4 h-4 mr-1"/>Enregistrer les modifications</>}</button></div>
    </div>
    {libraryOpen&&<div className="fixed inset-0 z-[3000] bg-black/70 flex items-center justify-center p-4" data-vce-ignore="true"><div className="w-full max-w-3xl max-h-[80vh] overflow-auto rounded-2xl bg-[#151c17] border border-[#d4af37]/60 p-4"><div className="flex items-center justify-between mb-3"><strong className="text-[#d4af37]">Bibliothèque média</strong><button type="button" onClick={()=>setLibraryOpen(false)}><X/></button></div>{library.length===0?<div className="text-sm text-[#a3b1a5] py-10 text-center">Aucun média importé.</div>:<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{library.map(item=><button key={item.url} type="button" onClick={()=>chooseLibraryItem(item)} className="rounded-xl overflow-hidden border border-[#334236] hover:border-[#d4af37] bg-[#0c110d] cursor-pointer">{/\.(mp4|webm|mov)(\?|$)/i.test(item.url)?<video src={item.url} muted className="w-full h-32 object-cover"/>:<img src={item.url} alt="" className="w-full h-32 object-cover"/>}<span className="block p-2 text-[10px] text-left truncate text-[#c4ceb8]">{item.pathname||item.url}</span></button>)}</div>}</div></div>}
  </>;
};
