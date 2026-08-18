import React, { useMemo, useState } from 'react';
import { Check, Image as ImageIcon, Save, Upload } from 'lucide-react';
import {
  ButtonOverride,
  ButtonRadiusId,
  ButtonSizeId,
  ButtonTextSizeId,
  ButtonStyleId,
  ButtonTargetId,
  ThemeConfig,
} from '../types';
import {
  buttonModelPresets,
  buttonSizePresets,
  buttonTextSizePresets,
  radiusPresets,
  getButtonClasses,
  getButtonInlineStyle,
  getCardClasses,
} from '../utils/themeStyles';

type ButtonEntry = {
  id: ButtonTargetId;
  label: string;
  location: string;
  variant: 'primary' | 'secondary';
};

const BUTTONS: ButtonEntry[] = [
  { id: 'navbar-order', label: 'Commander', location: 'Navigation principale', variant: 'primary' },
  { id: 'hero-order', label: 'Commander', location: 'Accueil / Hero', variant: 'primary' },
  { id: 'hero-discover', label: 'Découvrir la collection', location: 'Accueil / Hero', variant: 'secondary' },
  { id: 'showcase-order', label: 'Commander / Réserver', location: 'Fiche produit / Showcase', variant: 'primary' },
  { id: 'lookbook-order', label: 'Commander', location: 'Lookbook', variant: 'primary' },
  { id: 'comparison-order', label: 'Commander', location: 'Tableau comparatif', variant: 'primary' },
  { id: 'footer-workshop', label: 'Prendre Rendez-vous à l’Atelier', location: 'Footer / Atelier', variant: 'secondary' },
];

interface Props {
  theme: ThemeConfig;
  onChange: (patch: Partial<ThemeConfig>) => void;
}

const clone = (o?: ButtonOverride): ButtonOverride => ({ ...(o || {}) });

export const ButtonManager: React.FC<Props> = ({ theme, onChange }) => {
  const [selected, setSelected] = useState<ButtonTargetId[]>(['navbar-order']);
  const [savedName, setSavedName] = useState('');
  const [savedModels, setSavedModels] = useState<Array<{ name: string; override: ButtonOverride }>>([]);

  const selectedId = selected[0];
  const current = useMemo<ButtonOverride>(() => {
    const first = theme.buttonOverrides?.[selectedId];
    return clone(first);
  }, [theme.buttonOverrides, selectedId]);

  const updateSelected = (patch: ButtonOverride) => {
    const next = { ...(theme.buttonOverrides || {}) };
    selected.forEach((id) => {
      next[id] = { ...(next[id] || {}), ...patch };
    });
    onChange({ buttonOverrides: next });
  };

  const toggle = (id: ButtonTargetId) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => setSelected(selected.length === BUTTONS.length ? [] : BUTTONS.map(b => b.id));

  const image = current.backgroundImageUrl;
  const overlay = current.backgroundOverlay ?? 28;
  const model = current.buttonStyle || theme.buttonStyle;
  const size = current.buttonSize || theme.buttonSize || 'standard';
  const textSize = current.buttonTextSize || 'standard';
  const textColor = current.buttonTextColor || '';

  // Le rendu d'aperçu reprend exactement le moteur de rendu des vrais boutons.
  // On fusionne l'override du bouton sélectionné avec le thème global afin que
  // le changement de modèle (Or, Cuir, Sapin, etc.) soit immédiatement visible.
  const previewTheme: ThemeConfig = {
    ...theme,
    buttonStyle: current.buttonStyle || theme.buttonStyle,
    buttonRadius: current.buttonRadius || theme.buttonRadius,
    buttonSize: current.buttonSize || theme.buttonSize,
    buttonBackgroundImageUrl: current.backgroundImageUrl || theme.buttonBackgroundImageUrl,
    buttonBackgroundOverlay: current.backgroundOverlay ?? theme.buttonBackgroundOverlay,
    buttonOverrides: { 'navbar-order': current },
  };

  const previewPrimaryClass = getButtonClasses(previewTheme, 'primary', 'navbar-order');
  const previewSecondaryClass = getButtonClasses(previewTheme, 'secondary', 'navbar-order');
  const previewPrimaryStyle = getButtonInlineStyle(previewTheme, 'navbar-order');
  const previewSecondaryStyle = getButtonInlineStyle(previewTheme, 'navbar-order');
  const previewCard = getCardClasses(theme);

  return (
    <section className="rounded-2xl border border-[#3b473e] bg-[#151a17] p-4 sm:p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#f3ece0]">Gestionnaire de boutons</h3>
          <p className="text-[11px] text-[#87968a] mt-1">
            Modifie un bouton seul ou applique le même visuel à plusieurs boutons sélectionnés.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#66756a]">
          {selected.length} sélectionné{selected.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Aperçu repris de l'ancien bloc "Aperçu en Direct de vos Choix Graphiques".
          Il n'y a désormais qu'un seul aperçu dans cet onglet. */}
      <div className="sticky top-2 z-30 p-3 sm:p-4 rounded-xl bg-[#151b17]/95 backdrop-blur-md border border-[#3c4c3f] shadow-xl space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-[#d4af37] text-xs uppercase font-serif tracking-widest font-semibold">
            <span>✦</span>
            <span>Aperçu en Direct de vos Choix Graphiques</span>
          </div>
          <span className="text-[11px] text-[#a3b1a5] text-right">
            Modèle sélectionné : <strong>{model}</strong> • Arrondi : <strong>{current.buttonRadius || theme.buttonRadius}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
          <div className="space-y-2">
            <span className="text-[10px] text-[#a3b1a5] block uppercase tracking-wider">Boutons en action :</span>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                style={previewPrimaryStyle}
                className={`${previewPrimaryClass} !px-5 !py-2 !text-xs`}
              >
                {selected.length === 1 ? (BUTTONS.find(b => b.id === selectedId)?.label || theme.orderButtonText || 'Commander') : `${selected.length} boutons`}
              </button>
              <button
                type="button"
                style={previewSecondaryStyle}
                className={`${previewSecondaryClass} !px-5 !py-2 !text-xs`}
              >
                {theme.discoverButtonText || 'Découvrir'}
              </button>
            </div>
          </div>

          <div className={`hidden md:block p-3 rounded-xl ${previewCard.card} space-y-1 min-w-[250px]`}>
            <span className="text-[9px] uppercase tracking-widest text-[#d4af37]">Modèle de carte actif</span>
            <h4 className="font-serif text-sm text-[#f3ece0]">Carte Présentation Produit</h4>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#d8e0d6]">Boutons du site</h4>
          <button type="button" onClick={selectAll} className="text-[10px] uppercase tracking-wider text-[#d4af37]">
            {selected.length === BUTTONS.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>
        <div className="space-y-2">
          {BUTTONS.map((b) => (
            <label key={b.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${selected.includes(b.id) ? 'border-[#d4af37]/70 bg-[#1d281f]' : 'border-[#354037] bg-[#111612]'}`}>
              <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} className="h-4 w-4 accent-[#d4af37]" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-[#f3ece0] truncate">{b.label}</div>
                <div className="text-[10px] text-[#758278]">{b.location}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#354037] bg-[#111612] p-4 space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#d8e0d6]">Visuel des éléments sélectionnés</h4>
          <p className="text-[10px] text-[#758278] mt-1">Une modification est appliquée à tous les éléments cochés.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#d8e0d6]">Modèles graphiques</h5>
            <span className="text-[10px] text-[#758278]">Cliquez sur un rendu pour l’appliquer</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
            {buttonModelPresets.map(p => {
              const active = model === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updateSelected({ buttonStyle: p.id as ButtonStyleId })}
                  className={`text-left rounded-xl border p-2.5 transition-all ${active ? 'border-[#d4af37] bg-[#202b23] shadow-lg shadow-[#d4af37]/10' : 'border-[#354037] bg-[#111612] hover:border-[#536258]'}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider bg-black/40 text-[#d4af37] border border-[#d4af37]/40 truncate">{p.badge}</span>
                    {active && <span className="text-[10px] text-[#d4af37]">✓</span>}
                  </div>
                  <div className="text-[10px] font-medium text-[#cfd8cf] truncate mb-2">{p.name}</div>
                  <div className={`w-full py-2 text-[9px] uppercase tracking-wider text-center ${p.primaryClass} ${current.buttonRadius || 'rounded-full'}`}>Exemple : Commander</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {buttonSizePresets.map(p => (
              <button key={p.id} type="button" onClick={() => updateSelected({ buttonSize: p.id as ButtonSizeId })}
                className={`rounded-lg border px-2 py-2 text-[10px] ${size === p.id ? 'border-[#d4af37] text-[#d4af37] bg-[#202b23]' : 'border-[#455248] text-[#aeb9ae]'}`}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
            {radiusPresets.map(r => (
              <button key={r.id} type="button" onClick={() => updateSelected({ buttonRadius: r.id as ButtonRadiusId })}
                className={`rounded-lg border px-2 py-2 text-[10px] ${current.buttonRadius === r.id ? 'border-[#d4af37] text-[#d4af37] bg-[#202b23]' : 'border-[#455248] text-[#aeb9ae]'}`}>
                {r.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 rounded-xl border border-[#354037] bg-[#111612] p-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#87968a] mb-2">Taille du texte</div>
            <div className="grid grid-cols-5 gap-2">
              {buttonTextSizePresets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updateSelected({ buttonTextSize: p.id as ButtonTextSizeId })}
                  className={`rounded-lg border px-2 py-2 text-[10px] ${textSize === p.id ? 'border-[#d4af37] text-[#d4af37] bg-[#202b23]' : 'border-[#455248] text-[#aeb9ae]'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-end gap-2 min-w-[190px]">
            <span className="text-[10px] uppercase tracking-wider text-[#87968a] pb-2">Couleur du texte</span>
            <input
              type="color"
              value={textColor || '#f3ece0'}
              onChange={(e) => updateSelected({ buttonTextColor: e.target.value })}
              className="h-10 w-14 rounded-lg border border-[#455248] bg-[#182019] p-1 cursor-pointer"
              title="Choisir la couleur du texte"
            />
            <button
              type="button"
              onClick={() => updateSelected({ buttonTextColor: '' })}
              className="h-10 rounded-lg border border-[#455248] px-3 text-[10px] uppercase tracking-wider text-[#aeb9ae] hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Auto
            </button>
          </label>
        </div>

        <div className="rounded-xl border border-dashed border-[#536258] p-3 space-y-3">
          <div className="text-xs font-semibold text-[#f3ece0]">Image en fond</div>
          <div className="flex gap-2">
            <input
              value={current.backgroundImageUrl || ''}
              onChange={(e) => updateSelected({ backgroundImageUrl: e.target.value })}
              placeholder="URL de l'image…"
              className="flex-1 rounded-lg border border-[#455248] bg-[#182019] px-3 py-2 text-xs text-[#f3ece0]"
            />
            <label className="rounded-lg border border-[#455248] px-3 py-2 text-[10px] uppercase tracking-wider text-[#c4ceb8] cursor-pointer">
              <Upload className="inline w-3.5 h-3.5 mr-1" />
              Fichier
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => updateSelected({ backgroundImageUrl: String(reader.result) });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <ImageIcon className="w-4 h-4 text-[#d4af37]" />
            <span className="text-[10px] text-[#87968a]">Voile</span>
            <input
              type="range" min="0" max="90" value={overlay}
              onChange={(e) => updateSelected({ backgroundOverlay: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-[#c4ceb8] w-8">{overlay}%</span>
          </div>
        </div>

        <div className="flex gap-2">
          <input value={savedName} onChange={e => setSavedName(e.target.value)} placeholder="Nom du modèle…" className="flex-1 rounded-lg border border-[#455248] bg-[#182019] px-3 py-2 text-xs text-[#f3ece0]" />
          <button type="button" onClick={() => {
            if (!savedName.trim()) return;
            setSavedModels(prev => [...prev, { name: savedName.trim(), override: clone(current) }]);
            setSavedName('');
          }} className="rounded-lg border border-[#d4af37]/60 px-3 py-2 text-[10px] uppercase tracking-wider text-[#d4af37]">
            <Save className="inline w-3.5 h-3.5 mr-1" /> Mémoriser
          </button>
        </div>

        {savedModels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {savedModels.map((m, i) => (
              <button key={`${m.name}-${i}`} type="button" onClick={() => updateSelected(m.override)}
                className="text-left rounded-lg border border-[#455248] px-3 py-2 text-xs text-[#c4ceb8] hover:border-[#d4af37]">
                <strong className="block text-[#f3ece0]">{m.name}</strong>
                <span className="text-[10px] text-[#758278]">Réappliquer au{selected.length > 1 ? 'x' : ''} bouton{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
