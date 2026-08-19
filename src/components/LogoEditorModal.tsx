import React, { useEffect, useState } from 'react';
import { X, Image as ImageIcon, Save, RotateCcw } from 'lucide-react';
import { BrandConfig } from '../types';
import { LogoBlockConfig } from './LogoBlock';
import { getLogoConfig, LogoKind } from './LogoBlock';

interface Props {
  isOpen: boolean;
  brandData: BrandConfig;
  onClose: () => void;
  onSave: (next: BrandConfig) => void;
}

const makeInitial = (brandData: BrandConfig): BrandConfig => ({
  ...brandData,
  logos: {
    boutique: getLogoConfig(brandData, 'boutique'),
    gite: getLogoConfig(brandData, 'gite'),
  },
});

const LogoEditorFields: React.FC<{
  kind: LogoKind;
  value: LogoBlockConfig;
  onChange: (next: LogoBlockConfig) => void;
}> = ({ kind, value, onChange }) => {
  const update = (fields: Partial<LogoBlockConfig>) => onChange({ ...value, ...fields });
  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ imageUrl: String(reader.result || '') });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-widest text-[#a3b1a5]">Texte</span>
          <input value={value.text} onChange={e => update({ text: e.target.value })} className="w-full bg-[#121613] border border-[#38483b] rounded-xl px-3 py-2 text-sm text-white" />
        </label>
        <label className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-widest text-[#a3b1a5]">URL de l'image</span>
          <input value={value.imageUrl} onChange={e => update({ imageUrl: e.target.value })} placeholder="https://..." className="w-full bg-[#121613] border border-[#38483b] rounded-xl px-3 py-2 text-sm text-white" />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#3b4b3e] bg-[#1b241d] text-xs cursor-pointer">
          <ImageIcon className="w-4 h-4 text-[#d4af37]" />
          <span>Choisir un fichier</span>
          <input type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
        </label>
        <button type="button" onClick={() => update({ imageUrl: '' })} className="px-3 py-2 rounded-xl border border-[#3b4b3e] text-xs text-[#c4ceb8]">Supprimer l'image</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="space-y-1.5">
          <span className="text-[11px] text-[#a3b1a5]">Taille image</span>
          <input type="number" min={24} max={180} value={value.imageSize} onChange={e => update({ imageSize: Number(e.target.value) || 58 })} className="w-full bg-[#121613] border border-[#38483b] rounded-xl px-3 py-2 text-sm text-white" />
        </label>
        <label className="space-y-1.5">
          <span className="text-[11px] text-[#a3b1a5]">Taille texte</span>
          <input value={value.textSize} onChange={e => update({ textSize: e.target.value })} placeholder="24px" className="w-full bg-[#121613] border border-[#38483b] rounded-xl px-3 py-2 text-sm text-white" />
        </label>
        <label className="space-y-1.5">
          <span className="text-[11px] text-[#a3b1a5]">Couleur texte</span>
          <input type="color" value={value.textColor} onChange={e => update({ textColor: e.target.value })} className="w-full h-10 bg-[#121613] border border-[#38483b] rounded-xl p-1" />
        </label>
        <label className="space-y-1.5">
          <span className="text-[11px] text-[#a3b1a5]">Espace image/texte</span>
          <input type="number" min={0} max={50} value={value.gap} onChange={e => update({ gap: Number(e.target.value) || 0 })} className="w-full bg-[#121613] border border-[#38483b] rounded-xl px-3 py-2 text-sm text-white" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="text-[11px] text-[#a3b1a5]">Police</span>
          <select value={value.fontFamily} onChange={e => update({ fontFamily: e.target.value as LogoBlockConfig['fontFamily'] })} className="w-full bg-[#121613] border border-[#38483b] rounded-xl px-3 py-2 text-sm text-white">
            <option value="serif">Sérif élégante</option>
            <option value="sans">Sans moderne</option>
            <option value="display">Display</option>
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-[#38483b] bg-[#121613] px-3 py-2 mt-5">
          <input type="checkbox" checked={value.showText !== false} onChange={e => update({ showText: e.target.checked })} />
          <span className="text-xs text-[#c4ceb8]">Afficher le texte</span>
        </label>
      </div>

      <div className="rounded-2xl border border-[#38483b] bg-[#0e120f] p-4">
        <div className="text-[10px] uppercase tracking-widest text-[#7f8f82] mb-3">Aperçu — {kind === 'boutique' ? 'Boutique' : 'Gîte'}</div>
        <div className="flex items-center justify-center min-h-24">
          <div className="flex items-center" style={{ gap: value.gap }}>
            {value.imageUrl ? <img src={value.imageUrl} alt="" style={{ width: value.imageSize, height: value.imageSize }} className="rounded-full object-cover border border-[#d4af37]/60" /> : <div style={{ width: value.imageSize, height: value.imageSize }} className="rounded-full bg-[#202922] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] font-serif font-bold">MP</div>}
            {value.showText !== false && <span style={{ color: value.textColor, fontSize: value.textSize, fontFamily: value.fontFamily === 'sans' ? 'inherit' : 'Georgia, serif' }}>{value.text}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LogoEditorModal: React.FC<Props> = ({ isOpen, brandData, onClose, onSave }) => {
  const [draft, setDraft] = useState<BrandConfig>(() => makeInitial(brandData));
  const [active, setActive] = useState<LogoKind>('boutique');
  useEffect(() => { if (isOpen) { setDraft(makeInitial(brandData)); setActive('boutique'); } }, [isOpen, brandData]);
  if (!isOpen) return null;

  const logo = getLogoConfig(draft, active);
  const updateLogo = (next: LogoBlockConfig) => setDraft(prev => ({ ...prev, logos: { ...(prev.logos || {}), [active]: next } }));
  const save = () => { onSave(draft); onClose(); };

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#141a15] border border-[#3b473e] rounded-3xl shadow-2xl text-[#e2d5c3]">
        <div className="sticky top-0 z-10 px-6 py-4 bg-[#18201a] border-b border-[#2b372d] flex items-center justify-between">
          <div><h2 className="font-serif text-xl text-[#f3ece0]">Logos Boutique & Gîte</h2><p className="text-xs text-[#8f9f91] mt-1">Les deux blocs sont indépendants et réutilisés sur les pages.</p></div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#202922] flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-5">
            {(['boutique','gite'] as LogoKind[]).map(kind => <button key={kind} onClick={() => setActive(kind)} className={`px-4 py-2 rounded-xl text-xs uppercase tracking-widest border ${active === kind ? 'bg-[#d4af37] text-[#121613] border-[#d4af37]' : 'bg-[#202922] text-[#c4ceb8] border-[#3b4b3e]'}`}>{kind === 'boutique' ? 'Logo Boutique' : 'Logo Gîte'}</button>)}
          </div>
          <LogoEditorFields kind={active} value={logo} onChange={updateLogo} />
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[#2b372d]">
            <button onClick={() => setDraft(makeInitial(brandData))} className="px-4 py-2 rounded-xl border border-[#3b4b3e] text-xs flex items-center gap-2"><RotateCcw className="w-4 h-4" />Réinitialiser</button>
            <button onClick={save} className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#9c7844] to-[#d4af37] text-[#121613] font-serif font-bold text-xs flex items-center gap-2"><Save className="w-4 h-4" />Enregistrer les logos</button>
          </div>
        </div>
      </div>
    </div>
  );
};
