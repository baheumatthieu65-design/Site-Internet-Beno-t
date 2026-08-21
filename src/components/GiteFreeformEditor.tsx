import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Grip, Image as ImageIcon, Save, Type, Video, X, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import type { GiteContentBlock, GiteContentBlockType, GiteSiteConfig } from '../types';
import { prepareImageForUpload, uploadBackgroundVideo } from '../utils/mediaUpload';

const makeId = () => `gite-block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const newBlock = (type: GiteContentBlockType, moduleId: string): GiteContentBlock => ({
  id: makeId(), moduleId, type, x: 50, y: 50,
  width: type === 'video' ? 45 : type === 'image' ? 32 : 30,
  height: type === 'video' ? 30 : type === 'image' ? undefined : 18,
  text: type === 'button' ? 'Réserver' : type === 'heading' ? 'Nouveau titre' : 'Nouvelle zone de texte',
  link: '', url: '', fontSize: type === 'heading' ? 34 : 18, color: '#24231f', align: 'left',
  fontFamily: type === 'heading' ? 'display' : 'sans', fontWeight: type === 'heading' ? 500 : 400,
  lineHeight: 1.45, italic: false, backgroundColor: 'rgba(255,255,255,0.88)', borderColor: '#8c6e3f',
  borderWidth: 0, borderRadius: 18, padding: 12, opacity: 100, rotation: 0, objectFit: 'cover', visible: true,
});

interface Props {
  value: GiteSiteConfig;
  onChange: (value: GiteSiteConfig) => void;
  onSave?: (value: GiteSiteConfig) => Promise<void> | void;
  onClose: () => void;
}

export const GiteFreeformEditor: React.FC<Props> = ({ value, onChange, onSave, onClose }) => {
  const [position, setPosition] = useState({ x: Math.max(16, window.innerWidth - 500), y: 120 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number; w: number; h: number } | null>(null);
  const [selectedId, setSelectedId] = useState(value.contentBlocks?.[0]?.id || '');
  const moduleOptions = (value.modules || []).map((m) => [m.id, m.label] as const);
  const [selectedModuleId, setSelectedModuleId] = useState(value.modules?.[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const blocks = value.contentBlocks || [];
  useEffect(() => { if (value.modules?.length && !value.modules.some((m) => m.id === selectedModuleId)) setSelectedModuleId(value.modules[0].id); }, [value.modules, selectedModuleId]);
  const selected = blocks.find((b) => b.id === selectedId) || null;
  const moduleBlocks = blocks.filter((b) => b.moduleId === selectedModuleId);
  const typeLabel = (b: GiteContentBlock) => b.type === 'heading' ? 'Titre' : b.type === 'text' ? 'Texte' : b.type === 'image' ? 'Image' : b.type === 'video' ? 'Vidéo' : 'Bouton';
  const previewLabel = (b: GiteContentBlock) => { const raw = b.text || (b.type === 'image' ? 'Image importée' : b.type === 'video' ? 'Vidéo importée' : ''); return `${typeLabel(b)}${raw ? ` — ${raw.slice(0, 28)}${raw.length > 28 ? '…' : ''}` : ''}`; };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setPosition({
        x: Math.max(8, Math.min(window.innerWidth - d.w - 8, d.ox + e.clientX - d.sx)),
        y: Math.max(8, Math.min(window.innerHeight - d.h - 8, d.oy + e.clientY - d.sy)),
      });
    };
    const up = () => { dragRef.current = null; setDragging(false); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('button,input,textarea,select,a')) return;
    const r = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!r) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, w: r.width, h: r.height };
    setDragging(true);
  };

  const update = (patch: Partial<GiteSiteConfig>) => onChange({ ...value, ...patch });
  const updateBlock = (id: string, patch: Partial<GiteContentBlock>) => update({ contentBlocks: blocks.map((b) => b.id === id ? { ...b, ...patch } : b) });
  const add = (type: GiteContentBlockType) => { const b = newBlock(type, selectedModuleId); update({ contentBlocks: [...blocks, b] }); setSelectedId(b.id); };
  const selectModule = (id: string) => { setSelectedModuleId(id); const first = blocks.find((b) => b.moduleId === id); setSelectedId(first?.id || ''); };
  const remove = (id: string) => { const next = blocks.filter((b) => b.id !== id); update({ contentBlocks: next }); setSelectedId(next[0]?.id || ''); };

  const upload = async (type: 'image' | 'video', file: File) => {
    if (!selected) return;
    try {
      let url = '';
      if (type === 'video') url = await uploadBackgroundVideo(file);
      else {
        const prepared = await prepareImageForUpload(file);
        const form = new FormData(); form.append('file', prepared);
        const r = await fetch('/api/site-media', { method: 'POST', credentials: 'include', body: form });
        const d = await r.json().catch(() => null);
        if (!r.ok || !d?.url) throw new Error(d?.error || `Upload : HTTP ${r.status}`);
        url = String(d.url);
      }
      updateBlock(selected.id, { url, ...(type === 'image' ? { height: undefined, objectFit: 'contain' as const } : {}) });
    } catch (e) { window.alert(e instanceof Error ? e.message : 'Upload impossible.'); }
  };

  const save = async () => {
    if (!onSave) return;
    setSaving(true);
    try { await onSave(value); } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483100] pointer-events-none" data-vce-ignore="true">
      <div
        className="pointer-events-auto fixed w-[min(94vw,620px)] max-h-[82vh] overflow-auto rounded-2xl border border-[#536258] bg-[#111613]/98 text-[#f5eedf] shadow-2xl backdrop-blur"
        style={{ left: position.x, top: position.y }}
      >
        <div onPointerDown={startDrag} className={`sticky top-0 z-10 flex items-center justify-between border-b border-[#344139] bg-[#111613] px-4 py-3 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
          <div className="flex items-center gap-3"><Grip size={17} className="text-[#87968a]"/><div><div className="text-sm font-semibold">Zones libres du Gîte</div><div className="text-[10px] uppercase tracking-[.16em] text-[#87968a]">Modification en direct sur la page</div></div></div>
          <div className="flex items-center gap-2">
            {onSave && <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37] bg-[#d4af37] px-3 py-2 text-xs font-semibold text-[#111612] disabled:opacity-60"><Save size={14}/>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>}
            <button type="button" onClick={onClose} className="p-2" aria-label="Fermer"><X size={18}/></button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-[190px_1fr] gap-3">
            <aside className="space-y-2 rounded-xl border border-[#344139] bg-[#0d120f] p-2">
              <div className="px-2 pb-1 text-[10px] uppercase tracking-[.16em] text-[#87968a]">Blocs de la page</div>
              {moduleOptions.map(([id,label]) => (
                <button key={id} type="button" onClick={() => selectModule(id)} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${selectedModuleId === id ? 'bg-[#d4af37] text-[#111612]' : 'bg-[#18201a] text-[#c5d0c6]'}`}>{label}</button>
              ))}
              <div className="border-t border-[#344139] pt-2 mt-2">
                <div className="px-2 pb-1 text-[10px] uppercase tracking-[.16em] text-[#87968a]">Éléments</div>
                {moduleBlocks.map((b, i) => <button key={b.id} type="button" onClick={() => setSelectedId(b.id)} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${b.id === selectedId ? 'bg-[#d4af37] text-[#111612]' : 'bg-[#1b241d] text-[#c5d0c6]'}`} title={b.text || typeLabel(b)}>{i + 1}. {previewLabel(b)}</button>)}
                {!moduleBlocks.length && <div className="px-2 text-[11px] text-[#7f9382]">Aucun élément dans ce bloc.</div>}
              </div>
            </aside>

            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {([['text','Texte',Type],['heading','Titre',Type],['image','Image',ImageIcon],['video','Vidéo',Video],['button','Bouton',LinkIcon]] as const).map(([type,label,Icon]) => (
                  <button key={type} type="button" onClick={() => add(type)} className="rounded-xl border border-[#3d4b40] bg-[#18201a] px-2 py-2 text-[10px] text-[#e9e0d2] hover:border-[#d4af37]"><Icon size={14} className="mx-auto mb-1 text-[#d4af37]"/>{label}</button>
                ))}
              </div>

            {selected ? <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-[#a3b1a5]">Bloc<select value={selected.moduleId} onChange={e => updateBlock(selected.id,{moduleId:e.target.value})} className="mt-1 w-full rounded-lg bg-[#18201a] border border-[#344237] px-2 py-2 text-white">{moduleOptions.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
                <label className="text-[11px] text-[#a3b1a5] flex items-center gap-2 pt-6"><input type="checkbox" checked={selected.visible} onChange={e=>updateBlock(selected.id,{visible:e.target.checked})}/> Visible</label>
              </div>

              {(selected.type === 'text' || selected.type === 'heading' || selected.type === 'button') && <label className="text-[11px] text-[#a3b1a5]">Texte<textarea value={selected.text || ''} onChange={e=>updateBlock(selected.id,{text:e.target.value})} rows={3} className="mt-1 w-full rounded-lg bg-[#18201a] border border-[#344237] px-3 py-2 text-white"/></label>}
              {selected.type === 'button' && <label className="text-[11px] text-[#a3b1a5]">Lien<input value={selected.link || ''} onChange={e=>updateBlock(selected.id,{link:e.target.value})} placeholder="https://..." className="mt-1 w-full rounded-lg bg-[#18201a] border border-[#344237] px-3 py-2 text-white"/></label>}
              {selected.type === 'image' && <label className="block rounded-xl border border-dashed border-[#536258] p-3 text-center text-xs cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) void upload('image',f)}}/>Importer une image</label>}
              {selected.type === 'video' && <label className="block rounded-xl border border-dashed border-[#536258] p-3 text-center text-xs cursor-pointer"><input type="file" accept=".mp4,.webm,video/mp4,video/webm" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) void upload('video',f)}}/>Importer une vidéo</label>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {([['X %','x',0,100],['Y %','y',0,100],['Largeur %','width',8,95],['Hauteur %','height',10,95]] as const).map(([label,key,min,max]) => {
                  const current = (selected as any)[key] ?? (key === 'height' && selected.type === 'image' ? 0 : key === 'height' ? 18 : 50);
                  return <label key={key} className="text-[11px] text-[#a3b1a5]">{label}<div className="mt-1 flex items-center gap-2"><input type="range" min={min} max={max} value={current} onChange={e=>updateBlock(selected.id,{[key]:Number(e.target.value)} as any)} className="w-full accent-[#d4af37]"/><input type="number" min={min} max={max} value={current} onChange={e=>updateBlock(selected.id,{[key]:Number(e.target.value)} as any)} className="w-16 rounded-lg bg-[#18201a] border border-[#344237] px-2 py-2 text-white"/></div></label>;
                })}
                {([['Rotation °','rotation',-180,180],['Taille px','fontSize',10,160]] as const).map(([label,key,min,max]) => <label key={key} className="text-[11px] text-[#a3b1a5]">{label}<input type="number" min={min} max={max} value={(selected as any)[key] ?? (key === 'fontSize' ? 18 : 0)} onChange={e=>updateBlock(selected.id,{[key]:Number(e.target.value)} as any)} className="mt-1 w-full rounded-lg bg-[#18201a] border border-[#344237] px-2 py-2 text-white"/></label>)}
              </div>

              {(selected.type === 'text' || selected.type === 'heading' || selected.type === 'button') && <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <label className="text-[11px] text-[#a3b1a5]">Police<select value={selected.fontFamily || 'sans'} onChange={e=>updateBlock(selected.id,{fontFamily:e.target.value})} className="mt-1 w-full rounded-lg bg-[#18201a] border border-[#344237] px-2 py-2 text-white"><option value="sans">Sans</option><option value="serif">Serif</option><option value="display">DM Serif Display</option><option value="elegant">Playfair</option><option value="mono">Monospace</option></select></label>
                <label className="text-[11px] text-[#a3b1a5]">Graisse<select value={selected.fontWeight || 400} onChange={e=>updateBlock(selected.id,{fontWeight:Number(e.target.value)})} className="mt-1 w-full rounded-lg bg-[#18201a] border border-[#344237] px-2 py-2 text-white"><option value={300}>300</option><option value={400}>400</option><option value={500}>500</option><option value={600}>600</option><option value={700}>700</option></select></label>
                <label className="text-[11px] text-[#a3b1a5]">Couleur<input type="color" value={selected.color || '#24231f'} onChange={e=>updateBlock(selected.id,{color:e.target.value})} className="mt-1 h-9 w-full bg-transparent"/></label>
              </div>}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <label className="text-[11px] text-[#a3b1a5]">Fond<input value={selected.backgroundColor || ''} onChange={e=>updateBlock(selected.id,{backgroundColor:e.target.value})} placeholder="rgba(...)" className="mt-1 w-full rounded-lg bg-[#18201a] border border-[#344237] px-2 py-2 text-white"/></label>
                <label className="text-[11px] text-[#a3b1a5]">Opacité<div className="mt-1 flex items-center gap-2"><input type="range" min={0} max={100} value={selected.opacity ?? 100} onChange={e=>updateBlock(selected.id,{opacity:Number(e.target.value)})} className="w-full accent-[#d4af37]"/><span className="w-10 text-right">{selected.opacity ?? 100}%</span></div></label>
                <label className="text-[11px] text-[#a3b1a5]">Arrondi<input type="number" min={0} max={80} value={selected.borderRadius ?? 18} onChange={e=>updateBlock(selected.id,{borderRadius:Number(e.target.value)})} className="mt-1 w-full rounded-lg bg-[#18201a] border border-[#344237] px-2 py-2 text-white"/></label>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#344139]">
                <button type="button" onClick={()=>remove(selected.id)} className="rounded-lg border border-red-900/70 bg-red-950/30 px-3 py-2 text-xs text-red-300"><Trash2 size={14} className="inline mr-1"/>Supprimer</button>
                <button type="button" disabled={saving} onClick={()=>void save()} className="rounded-lg bg-[#d4af37] px-4 py-2 text-xs font-semibold text-[#111612]"><Save size={14} className="inline mr-1"/>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
            </div> : <div className="rounded-xl border border-dashed border-[#536258] p-6 text-center text-xs text-[#87968a]">Sélectionne un élément.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
