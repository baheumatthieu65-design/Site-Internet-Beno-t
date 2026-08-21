import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Image as ImageIcon, Video, Type, MousePointer2, Move } from 'lucide-react';
import type { GiteContentBlock, GiteContentBlockType, GiteSiteConfig } from '../types';
import { prepareImageForUpload, uploadBackgroundVideo } from '../utils/mediaUpload';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  value: GiteSiteConfig;
  onChange: (value: GiteSiteConfig) => void;
}

const moduleOptions = [
  ['gite-hero','Le gîte — Accueil'],['gite-experience','Le gîte'],['gite-gallery','Galerie'],['gite-video','Vidéo'],
  ['gite-essentials','Équipements'],['gite-nearby','La région'],['gite-stay','Séjourner'],['gite-access','Accès'],
] as const;

const fontMap: Record<string,string> = {
  sans: 'Manrope, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  display: '"DM Serif Display", Georgia, serif',
  elegant: '"Playfair Display", Georgia, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

const makeId = () => `gite-block-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const newBlock = (type: GiteContentBlockType, moduleId: string): GiteContentBlock => ({
  id: makeId(), moduleId, type, x: 50, y: 50,
  width: type === 'video' ? 45 : type === 'image' ? 32 : 30,
  height: type === 'video' ? 30 : type === 'image' ? 28 : undefined,
  text: type === 'button' ? 'Réserver' : type === 'heading' ? 'Nouveau titre' : 'Nouvelle zone de texte',
  link: '', url: '', fontSize: type === 'heading' ? 34 : 18, color: '#24231f', align: 'left',
  fontFamily: type === 'heading' ? 'display' : 'sans', fontWeight: type === 'heading' ? 500 : 400,
  lineHeight: 1.45, italic: false, backgroundColor: 'rgba(255,255,255,0.88)', borderColor: '#8c6e3f',
  borderWidth: 0, borderRadius: 18, padding: 12, opacity: 100, rotation: 0, objectFit: 'cover', visible: true,
});

export const GiteFreeBlocksModal: React.FC<Props> = ({ isOpen, onClose, value, onChange }) => {
  const [uploading, setUploading] = useState<string | null>(null);
  if (!isOpen) return null;
  const c = value;
  const blocks = c.contentBlocks || [];
  const updateBlocks = (contentBlocks: GiteContentBlock[]) => onChange({ ...c, contentBlocks });
  const updateBlock = (id: string, patch: Partial<GiteContentBlock>) =>
    updateBlocks(blocks.map(b => b.id === id ? { ...b, ...patch } : b));
  const add = (type: GiteContentBlockType, moduleId = 'gite-experience') =>
    updateBlocks([...blocks, newBlock(type, moduleId)]);
  const remove = (id: string) => updateBlocks(blocks.filter(b => b.id !== id));

  const uploadImage = async (block: GiteContentBlock, file: File) => {
    setUploading(block.id);
    try {
      const prepared = await prepareImageForUpload(file);
      const form = new FormData(); form.append('file', prepared);
      const r = await fetch('/api/site-media', { method: 'POST', credentials: 'include', body: form });
      const d = await r.json().catch(() => null);
      if (!r.ok || !d?.url) throw new Error(d?.error || `Upload : HTTP ${r.status}`);
      updateBlock(block.id, { url: String(d.url) });
    } catch (e) { alert(e instanceof Error ? e.message : 'Upload image impossible.'); }
    finally { setUploading(null); }
  };

  const uploadVideo = async (block: GiteContentBlock, file: File) => {
    setUploading(block.id);
    try {
      const url = await uploadBackgroundVideo(file);
      updateBlock(block.id, { url });
    } catch (e) { alert(e instanceof Error ? e.message : 'Upload vidéo impossible.'); }
    finally { setUploading(null); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[51000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl border border-[#d4af37]/60 bg-[#111612] text-[#e2d5c3] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#2f3d31] bg-[#18201a]">
          <div>
            <div className="flex items-center gap-2">
              <Move className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-serif text-xl text-[#f3ece0]">Zones libres du Gîte</h3>
            </div>
            <p className="text-xs text-[#9eb0a0] mt-1">Crée et place librement du texte, des images, des vidéos et des boutons dans chaque bloc du Gîte.</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-[#202922] border border-[#3b4b3e] flex items-center justify-center hover:bg-[#2e3b30]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-[#2a362c] bg-[#0d120e]">
          <button type="button" onClick={() => add('heading')} className="px-3 py-2 rounded-lg bg-[#263128] border border-[#435747] text-white text-xs"><Type className="inline w-3.5 h-3.5 mr-1"/>+ Titre</button>
          <button type="button" onClick={() => add('text')} className="px-3 py-2 rounded-lg bg-[#263128] border border-[#435747] text-white text-xs">+ Texte</button>
          <button type="button" onClick={() => add('image')} className="px-3 py-2 rounded-lg bg-[#263128] border border-[#435747] text-white text-xs"><ImageIcon className="inline w-3.5 h-3.5 mr-1"/>+ Image</button>
          <button type="button" onClick={() => add('video')} className="px-3 py-2 rounded-lg bg-[#263128] border border-[#435747] text-white text-xs"><Video className="inline w-3.5 h-3.5 mr-1"/>+ Vidéo</button>
          <button type="button" onClick={() => add('button')} className="px-3 py-2 rounded-lg bg-[#263128] border border-[#d4af37]/60 text-[#d4af37] text-xs"><MousePointer2 className="inline w-3.5 h-3.5 mr-1"/>+ Bouton</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {blocks.length === 0 && <div className="border border-dashed border-[#465849] rounded-2xl p-8 text-center text-sm text-[#7f9382]">Aucune zone libre. Utilise les boutons ci-dessus pour créer ton premier élément.</div>}
          {blocks.map((b, index) => (
            <div key={b.id} className="rounded-2xl border border-[#344437] bg-[#18201a] p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#d4af37]">#{index + 1}</span>
                  <strong className="text-sm text-[#f3ece0]">{b.type === 'heading' ? 'Titre' : b.type === 'text' ? 'Zone de texte' : b.type === 'image' ? 'Image' : b.type === 'video' ? 'Vidéo' : 'Bouton'}</strong>
                </div>
                <button type="button" onClick={() => remove(b.id)} className="px-2.5 py-1.5 rounded-lg border border-red-900/70 text-red-300 text-xs"><Trash2 className="inline w-3.5 h-3.5 mr-1"/>Supprimer</button>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <label className="text-xs text-[#a3b1a5]">Bloc de la page
                  <select value={b.moduleId} onChange={e => updateBlock(b.id, { moduleId: e.target.value })} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white">
                    {moduleOptions.map(([id,label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </label>
                <label className="text-xs text-[#a3b1a5]">Visible
                  <span className="mt-2 flex items-center gap-2"><input type="checkbox" checked={b.visible} onChange={e => updateBlock(b.id, { visible: e.target.checked })}/> Afficher sur la page</span>
                </label>
                <label className="text-xs text-[#a3b1a5]">Positionnement
                  <span className="mt-2 flex items-center gap-2 text-[#d4af37]"><Move className="w-3.5 h-3.5"/> X / Y manuels + curseurs</span>
                </label>
              </div>

              {b.type !== 'image' && b.type !== 'video' && (
                <label className="block text-xs text-[#a3b1a5]">{b.type === 'button' ? 'Texte du bouton' : 'Texte'}
                  <textarea value={b.text || ''} onChange={e => updateBlock(b.id, { text: e.target.value })} className="mt-2 w-full min-h-20 bg-[#101510] border border-[#344237] rounded-lg px-3 py-2 text-white"/>
                </label>
              )}
              {b.type === 'button' && <label className="block text-xs text-[#a3b1a5]">Lien
                <input value={b.link || ''} onChange={e => updateBlock(b.id, { link: e.target.value })} placeholder="https://..." className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-3 py-2 text-white"/>
              </label>}
              {b.type === 'image' && <div className="grid md:grid-cols-2 gap-3">
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) void uploadImage(b, f); }} className="text-xs text-[#a3b1a5]"/>
                <input value={b.url || ''} onChange={e => updateBlock(b.id, { url: e.target.value })} placeholder="URL image" className="bg-[#101510] border border-[#344237] rounded-lg px-3 py-2 text-white text-xs"/>
                {b.url && <img src={b.url} alt="" className="md:col-span-2 max-h-48 w-full object-cover rounded-xl"/>}
                <input value={b.alt || ''} onChange={e => updateBlock(b.id, { alt: e.target.value })} placeholder="Texte alternatif" className="bg-[#101510] border border-[#344237] rounded-lg px-3 py-2 text-white text-xs"/>
              </div>}
              {b.type === 'video' && <div className="grid md:grid-cols-2 gap-3">
                <input type="file" accept=".mp4,.webm,video/mp4,video/webm" onChange={e => { const f = e.target.files?.[0]; if (f) void uploadVideo(b, f); }} className="text-xs text-[#a3b1a5]"/>
                <input value={b.url || ''} onChange={e => updateBlock(b.id, { url: e.target.value })} placeholder="URL vidéo" className="bg-[#101510] border border-[#344237] rounded-lg px-3 py-2 text-white text-xs"/>
                {b.url && <video src={b.url} controls className="md:col-span-2 max-h-48 w-full rounded-xl"/>}
              </div>}
              {uploading === b.id && <div className="text-xs text-[#d4af37]">Import en cours…</div>}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(['x','y'] as const).map(key => <label key={key} className="text-xs text-[#a3b1a5]">{key.toUpperCase()} %
                  <input type="number" min="0" max="100" value={b[key]} onChange={e => updateBlock(b.id, { [key]: Number(e.target.value) } as Partial<GiteContentBlock>)} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white"/>
                  <input type="range" min="0" max="100" value={b[key]} onChange={e => updateBlock(b.id, { [key]: Number(e.target.value) } as Partial<GiteContentBlock>)} className="w-full accent-[#d4af37]"/>
                </label>)}
                <label className="text-xs text-[#a3b1a5]">Largeur %
                  <input type="number" min="8" max="95" value={b.width} onChange={e => updateBlock(b.id, { width: Number(e.target.value) })} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white"/>
                </label>
                <label className="text-xs text-[#a3b1a5]">Hauteur %
                  <input type="number" min="10" max="95" value={b.height || 30} onChange={e => updateBlock(b.id, { height: Number(e.target.value) })} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white"/>
                </label>
                <label className="text-xs text-[#a3b1a5]">Rotation °
                  <input type="number" min="-180" max="180" value={b.rotation || 0} onChange={e => updateBlock(b.id, { rotation: Number(e.target.value) })} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white"/>
                </label>
                <label className="text-xs text-[#a3b1a5]">Taille du texte
                  <input type="number" min="10" max="160" value={b.fontSize || 18} onChange={e => updateBlock(b.id, { fontSize: Number(e.target.value) })} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white"/>
                </label>
                <label className="text-xs text-[#a3b1a5]">Police
                  <select value={b.fontFamily || 'sans'} onChange={e => updateBlock(b.id, { fontFamily: e.target.value })} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white">
                    <option value="sans">Sans</option><option value="serif">Serif</option><option value="display">DM Serif Display</option><option value="elegant">Playfair Display</option><option value="mono">Monospace</option>
                  </select>
                </label>
                <label className="text-xs text-[#a3b1a5]">Graisse
                  <select value={b.fontWeight || 400} onChange={e => updateBlock(b.id, { fontWeight: Number(e.target.value) })} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white"><option value={300}>300</option><option value={400}>400</option><option value={500}>500</option><option value={600}>600</option><option value={700}>700</option></select>
                </label>
                <label className="text-xs text-[#a3b1a5]">Couleur du texte
                  <input type="color" value={b.color || '#24231f'} onChange={e => updateBlock(b.id, { color: e.target.value })} className="mt-2 h-9 w-full bg-transparent"/>
                </label>
                <label className="text-xs text-[#a3b1a5]">Fond de bulle
                  <input value={b.backgroundColor || ''} onChange={e => updateBlock(b.id, { backgroundColor: e.target.value })} placeholder="rgba(255,255,255,.88)" className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white text-xs"/>
                </label>
                <label className="text-xs text-[#a3b1a5]">Opacité %
                  <input type="number" min="0" max="100" value={b.opacity ?? 100} onChange={e => updateBlock(b.id, { opacity: Number(e.target.value) })} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white"/>
                </label>
                <label className="text-xs text-[#a3b1a5]">Rayon px
                  <input type="number" min="0" max="80" value={b.borderRadius ?? 18} onChange={e => updateBlock(b.id, { borderRadius: Number(e.target.value) })} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white"/>
                </label>
                <label className="text-xs text-[#a3b1a5]">Alignement
                  <select value={b.align || 'left'} onChange={e => updateBlock(b.id, { align: e.target.value as 'left'|'center'|'right' })} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-lg px-2 py-2 text-white"><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option></select>
                </label>
                <label className="text-xs text-[#a3b1a5] flex items-center gap-2 pt-6"><input type="checkbox" checked={!!b.italic} onChange={e => updateBlock(b.id, { italic: e.target.checked })}/> Italique</label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GiteFreeBlocksModal;
