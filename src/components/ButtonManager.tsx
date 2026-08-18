import React, { useMemo, useState } from 'react';
import { Check, Image as ImageIcon, Save, Upload } from 'lucide-react';
import {
  ButtonOverride,
  ButtonRadiusId,
  ButtonSizeId,
  ButtonStyleId,
  ButtonTargetId,
  ThemeConfig,
} from '../types';
import { buttonModelPresets, buttonSizePresets, radiusPresets } from '../utils/themeStyles';

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

  const previewStyle = {
    borderRadius:
      radiusPresets.find(r => r.id === (current.buttonRadius || theme.buttonRadius))?.cssClass === 'rounded-full'
        ? '9999px' : '12px',
  } as React.CSSProperties;

  const image = current.backgroundImageUrl;
  const overlay = current.backgroundOverlay ?? 28;
  const model = current.buttonStyle || theme.buttonStyle;
  const size = current.buttonSize || theme.buttonSize || 'standard';

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

      <div className="sticky top-0 z-10 rounded-xl border border-[#455248] bg-[#101410]/95 backdrop-blur p-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#87968a] mb-2">Aperçu permanent</div>
        <div className="h-20 rounded-lg border border-[#354037] bg-[#111612] flex items-center justify-center">
          <button
            type="button"
            style={{
              ...previewStyle,
              ...(image ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,${overlay / 100}), rgba(0,0,0,${overlay / 100})), url(${JSON.stringify(image)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {}),
            }}
            className="px-6 py-3 text-xs uppercase tracking-widest font-semibold bg-[#d4af37] text-[#121613] border border-[#f0dfbe]/40"
          >
            {selected.length === 1 ? BUTTONS.find(b => b.id === selectedId)?.label : `${selected.length} boutons`}
          </button>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {buttonModelPresets.map(p => (
            <button key={p.id} type="button" onClick={() => updateSelected({ buttonStyle: p.id as ButtonStyleId })}
              className={`rounded-lg border px-2 py-2 text-[10px] ${model === p.id ? 'border-[#d4af37] text-[#d4af37] bg-[#202b23]' : 'border-[#455248] text-[#aeb9ae]'}`}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {buttonSizePresets.map(p => (
            <button key={p.id} type="button" onClick={() => updateSelected({ buttonSize: p.id as ButtonSizeId })}
              className={`rounded-lg border px-2 py-2 text-[10px] ${size === p.id ? 'border-[#d4af37] text-[#d4af37] bg-[#202b23]' : 'border-[#455248] text-[#aeb9ae]'}`}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {radiusPresets.map(r => (
            <button key={r.id} type="button" onClick={() => updateSelected({ buttonRadius: r.id as ButtonRadiusId })}
              className={`rounded-lg border px-2 py-2 text-[10px] ${current.buttonRadius === r.id ? 'border-[#d4af37] text-[#d4af37] bg-[#202b23]' : 'border-[#455248] text-[#aeb9ae]'}`}>
              {r.name}
            </button>
          ))}
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
