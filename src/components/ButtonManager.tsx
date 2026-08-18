import React, { useState } from 'react';
import {
  ButtonOverride,
  ButtonRadiusId,
  ButtonSizeId,
  ButtonStyleId,
  ButtonTargetId,
  ThemeConfig,
} from '../types';
import {
  buttonModelPresets,
  buttonSizePresets,
  getButtonClasses,
  getButtonInlineStyle,
  radiusPresets,
} from '../utils/themeStyles';
import { Check, Image as ImageIcon, Save, Upload, RotateCcw, Copy, Layers3 } from 'lucide-react';

interface ButtonManagerProps {
  theme: ThemeConfig;
  updateTheme: (fields: Partial<ThemeConfig>) => void;
}

type ButtonTargetMeta = {
  id: ButtonTargetId;
  label: string;
  location: string;
  variant: 'primary' | 'secondary';
};

const TARGETS: ButtonTargetMeta[] = [
  { id: 'navbar-order', label: 'Commander', location: 'Navigation principale', variant: 'primary' },
  { id: 'hero-primary', label: 'Commander', location: 'Accueil / Hero', variant: 'primary' },
  { id: 'hero-secondary', label: 'Découvrir la collection', location: 'Accueil / Hero', variant: 'secondary' },
  { id: 'showcase-order', label: 'Commander / Réserver', location: 'Fiche produit / Showcase', variant: 'primary' },
  { id: 'showcase-jacket', label: 'Sélectionner une veste', location: 'Fiche produit / Showcase', variant: 'secondary' },
  { id: 'lookbook-order', label: 'Commander depuis le Lookbook', location: 'Lookbook', variant: 'primary' },
  { id: 'comparison-order', label: 'Commander', location: 'Tableau comparatif', variant: 'primary' },
  { id: 'footer-workshop', label: 'Prendre rendez-vous', location: 'Footer / Atelier', variant: 'secondary' },
];

const getEffective = (theme: ThemeConfig, id: ButtonTargetId): ButtonOverride => ({
  buttonStyle: theme.buttonOverrides?.[id]?.buttonStyle || theme.buttonStyle,
  buttonRadius: theme.buttonOverrides?.[id]?.buttonRadius || theme.buttonRadius,
  buttonSize: theme.buttonOverrides?.[id]?.buttonSize || theme.buttonSize || 'standard',
  backgroundImageUrl:
    theme.buttonOverrides?.[id]?.backgroundImageUrl ?? theme.buttonBackgroundImageUrl ?? '',
  backgroundOverlay:
    theme.buttonOverrides?.[id]?.backgroundOverlay ?? theme.buttonBackgroundOverlay ?? 28,
});

export const ButtonManager: React.FC<ButtonManagerProps> = ({ theme, updateTheme }) => {
  const [selectedIds, setSelectedIds] = useState<ButtonTargetId[]>([]);
  const [activeId, setActiveId] = useState<ButtonTargetId>('navbar-order');
  const [uploading, setUploading] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [library, setLibrary] = useState<Array<{ url: string }>>([]);
  const [modelName, setModelName] = useState('Mon modèle bouton');

  const activeMeta = TARGETS.find((target) => target.id === activeId) || TARGETS[0];
  const activeStyle = getEffective(theme, activeId);
  const savedModel = theme.savedButtonModel;

  const allSelected = selectedIds.length === TARGETS.length;

  const toggleSelected = (id: ButtonTargetId) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const selectAll = () => setSelectedIds(allSelected ? [] : TARGETS.map((target) => target.id));

  const applyToTargets = (patch: ButtonOverride) => {
    const ids = selectedIds.length > 0 ? selectedIds : [activeId];
    const next = { ...(theme.buttonOverrides || {}) };
    ids.forEach((id) => {
      next[id] = { ...(next[id] || {}), ...patch };
    });
    updateTheme({ buttonOverrides: next });
  };

  const resetTarget = (id: ButtonTargetId) => {
    const next = { ...(theme.buttonOverrides || {}) };
    delete next[id];
    updateTheme({ buttonOverrides: next });
  };

  const saveModel = () => {
    updateTheme({
      savedButtonModel: {
        name: modelName.trim() || 'Mon modèle bouton',
        buttonStyle: activeStyle.buttonStyle,
        buttonRadius: activeStyle.buttonRadius,
        buttonSize: activeStyle.buttonSize,
        backgroundImageUrl: activeStyle.backgroundImageUrl,
        backgroundOverlay: activeStyle.backgroundOverlay,
      },
    });
  };

  const applySavedModel = () => {
    if (!savedModel) return;
    applyToTargets(savedModel);
  };

  const loadLibrary = async () => {
    setLibraryLoading(true);
    try {
      const response = await fetch('/api/site-media', { credentials: 'include', headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || `Bibliothèque : HTTP ${response.status}`);
      setLibrary(Array.isArray(data.items) ? data.items.map((item: { url?: string }) => ({ url: String(item.url || '') })).filter((item: { url: string }) => item.url) : []);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Bibliothèque indisponible.');
    } finally {
      setLibraryLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/site-media', { method: 'POST', credentials: 'include', body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data?.url) throw new Error(data?.error || `Upload : HTTP ${response.status}`);
      const url = String(data.url);
      setLibrary((items) => [{ url }, ...items]);
      applyToTargets({ backgroundImageUrl: url });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Import impossible.');
    } finally {
      setUploading(false);
    }
  };

  const selectedLabel = selectedIds.length === 0
    ? `1 bouton actif : ${activeMeta.label}`
    : `${selectedIds.length} bouton${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''}`;

  return (
    <div className="space-y-6 pt-6 border-t border-[#2a362c]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h4 className="font-serif text-xl text-[#f3ece0] font-semibold flex items-center gap-2">
            <Layers3 className="w-5 h-5 text-[#d4af37]" />
            Gestion indépendante des boutons
          </h4>
          <p className="text-xs text-[#a3b1a5] mt-1 max-w-3xl">
            Chaque bouton d’action possède maintenant son propre visuel. Coche plusieurs boutons pour appliquer exactement le même style à tous.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={selectAll} className="px-3 py-2 rounded-lg border border-[#3c4c3f] bg-[#1a221c] text-[11px] text-[#d4af37]">
            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <span className="text-[11px] text-[#87968a]">{selectedLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-6">
        <div className="space-y-2">
          {TARGETS.map((target) => {
            const checked = selectedIds.includes(target.id);
            const effective = getEffective(theme, target.id);
            const classes = getButtonClasses(theme, target.variant, target.id);
            const style = getButtonInlineStyle(theme, target.id);
            return (
              <div key={target.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${activeId === target.id ? 'border-[#d4af37]/70 bg-[#202a22]' : 'border-[#344437] bg-[#171e19]'}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelected(target.id)}
                  className="accent-[#d4af37] w-4 h-4 shrink-0"
                  aria-label={`Sélectionner ${target.label}`}
                />
                <button type="button" onClick={() => setActiveId(target.id)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#f3ece0]">{target.label}</div>
                      <div className="text-[10px] text-[#87968a] mt-0.5">{target.location}</div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#7e8e82]">{effective.buttonSize}</span>
                  </div>
                  <div className="mt-2">
                    <span style={style} className={`inline-flex min-w-[170px] justify-center ${classes}`}>{target.label}</span>
                  </div>
                </button>
                <button type="button" onClick={() => resetTarget(target.id)} className="p-2 rounded-lg text-[#87968a] hover:text-red-200 hover:bg-red-950/20" title="Revenir au style global">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[#3c4c3f] bg-[#18201a] p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#d4af37]">Bouton en cours</div>
              <h5 className="font-serif text-lg text-[#f3ece0] font-semibold mt-1">{activeMeta.label}</h5>
              <p className="text-[11px] text-[#87968a]">{activeMeta.location}</p>
            </div>
            <span className="px-2 py-1 rounded-full border border-[#d4af37]/30 text-[10px] text-[#d4af37]">{selectedIds.length ? 'Masse' : 'Individuel'}</span>
          </div>

          <div className="flex justify-center p-4 rounded-xl bg-[#111612] border border-[#2e3b30]">
            <span style={getButtonInlineStyle(theme, activeId)} className={getButtonClasses(theme, activeMeta.variant, activeId)}>{activeMeta.label}</span>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#a3b1a5] mb-2">Modèle / matière</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {buttonModelPresets.map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyToTargets({ buttonStyle: preset.id })} className={`p-2.5 rounded-xl border text-left ${activeStyle.buttonStyle === preset.id ? 'border-[#d4af37] bg-[#253127]' : 'border-[#334236] bg-[#141a15]'}`}>
                  <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#f3ece0]">{preset.name}</span>{activeStyle.buttonStyle === preset.id && <Check className="w-4 h-4 text-[#d4af37]" />}</div>
                  <div className="text-[10px] text-[#87968a] mt-1">{preset.badge}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#a3b1a5] mb-2">Taille</label>
            <div className="grid grid-cols-4 gap-2">
              {buttonSizePresets.map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyToTargets({ buttonSize: preset.id })} className={`py-2 rounded-lg border text-[10px] ${activeStyle.buttonSize === preset.id ? 'border-[#d4af37] bg-[#d4af37] text-[#121613] font-bold' : 'border-[#334236] text-[#a3b1a5]'}`}>{preset.name}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#a3b1a5] mb-2">Forme</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {radiusPresets.map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyToTargets({ buttonRadius: preset.id })} className={`py-2 px-2 rounded-lg border text-[10px] ${activeStyle.buttonRadius === preset.id ? 'border-[#d4af37] bg-[#253127] text-[#d4af37]' : 'border-[#334236] text-[#a3b1a5]'}`}>{preset.name}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#a3b1a5] mb-2">Image en fond — texte conservé au-dessus</label>
            <div className="flex flex-wrap gap-2">
              <label className="px-3 py-2 rounded-lg border border-[#3c4c3f] bg-[#202922] text-[11px] text-[#d4af37] cursor-pointer">
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file); e.currentTarget.value = ''; }} />
                <Upload className="w-3.5 h-3.5 inline mr-1.5" />{uploading ? 'Import…' : 'Choisir un fichier'}
              </label>
              <button type="button" onClick={() => void loadLibrary()} className="px-3 py-2 rounded-lg border border-[#3c4c3f] bg-[#202922] text-[11px] text-[#a3b1a5] hover:text-[#d4af37]">
                <ImageIcon className="w-3.5 h-3.5 inline mr-1.5" />{libraryLoading ? 'Chargement…' : 'Bibliothèque'}
              </button>
              <button type="button" onClick={() => applyToTargets({ backgroundImageUrl: '' })} className="px-3 py-2 rounded-lg border border-red-900/40 text-[11px] text-red-200">Retirer l’image</button>
            </div>
            {activeStyle.backgroundImageUrl && <img src={activeStyle.backgroundImageUrl} alt="Fond du bouton" className="mt-3 h-24 w-full object-cover rounded-xl border border-[#3c4c3f]" />}
            <label className="block text-[10px] text-[#87968a] mt-3">Voile de lisibilité : {Math.round(activeStyle.backgroundOverlay || 0)}%</label>
            <input type="range" min="0" max="90" value={activeStyle.backgroundOverlay || 0} onChange={(e) => applyToTargets({ backgroundOverlay: Number(e.target.value) })} className="w-full accent-[#d4af37]" />
            {library.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {library.slice(0, 10).map((item, index) => (
                  <button key={`${item.url}-${index}`} type="button" onClick={() => applyToTargets({ backgroundImageUrl: item.url })} className="overflow-hidden rounded-lg border border-[#334236] hover:border-[#d4af37]">
                    <img src={item.url} alt="Bibliothèque" className="h-12 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#2a362c] space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-[#a3b1a5]">Mémoire du modèle actuel</div>
            <div className="flex gap-2">
              <input value={modelName} onChange={(e) => setModelName(e.target.value)} className="flex-1 min-w-0 bg-[#121613] border border-[#313f33] rounded-lg px-3 py-2 text-xs text-white" />
              <button type="button" onClick={saveModel} className="px-3 py-2 rounded-lg bg-[#253127] border border-[#d4af37]/50 text-[#d4af37] text-[10px] uppercase tracking-wider"><Save className="w-3.5 h-3.5 inline mr-1" />Mémoriser</button>
            </div>
            {savedModel && (
              <button type="button" onClick={applySavedModel} className="w-full py-2.5 rounded-xl border border-[#d4af37]/50 bg-[#202922] text-[#d4af37] text-xs font-semibold"><Copy className="w-3.5 h-3.5 inline mr-1.5" />Réappliquer « {savedModel.name} » aux boutons sélectionnés</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
