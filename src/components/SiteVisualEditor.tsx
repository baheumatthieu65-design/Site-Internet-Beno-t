import React, { useEffect, useState } from 'react';
import { Check, Loader2, Plus, Save, Settings2, Trash2, X } from 'lucide-react';
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
  onSave: () => Promise<void> | void;
}

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

  if (position === 'top') {
    bar.style.top = '0';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.width = '100%';
  } else if (position === 'bottom') {
    bar.style.bottom = '0';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.width = '100%';
  } else if (position === 'left') {
    bar.style.top = '50%';
    bar.style.left = '0';
    bar.style.width = 'min(92vw, 420px)';
    bar.style.transform = 'translateY(-50%)';
  } else {
    bar.style.top = '50%';
    bar.style.right = '0';
    bar.style.width = 'min(92vw, 420px)';
    bar.style.transform = 'translateY(-50%)';
  }
};

export const SiteVisualEditor: React.FC<Props> = ({ config, onChange, onSave }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) applyAdminBarPosition(config.adminBarPosition || 'top');
  }, [open, config.adminBarPosition]);

  const update = (patch: Partial<SiteEditorConfig>) => {
    onChange({ ...config, ...patch });
  };

  const add = (type: EditorBlock['type']) => {
    update({
      blocks: [
        ...config.blocks,
        {
          id: `block-${Date.now()}`,
          type,
          section: 'hero',
          x: 50,
          y: 55,
          text: type === 'button' ? 'Nouveau bouton' : type === 'heading' ? 'Nouveau titre' : 'Nouveau texte',
          url: type === 'button' ? '#' : undefined,
          visible: true,
        },
      ],
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await onSave();
      setMessage('Modifications enregistrées.');
    } catch (err) {
      console.error(err);
      setError('Impossible d’enregistrer les modifications.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[2000] rounded-full bg-[#d4af37] text-black p-3 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
        title="Ouvrir l’éditeur visuel"
        aria-label="Ouvrir l’éditeur visuel"
      >
        <Settings2 className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside
      className="fixed bottom-4 right-4 z-[2000] w-[min(440px,calc(100vw-2rem))] max-h-[85vh] overflow-hidden rounded-2xl bg-[#111711] text-white border border-[#d4af37]/70 shadow-2xl"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#334236] bg-[#172019]">
        <div>
          <strong className="text-[#d4af37] block">Éditeur visuel</strong>
          <span className="text-[10px] text-[#9aaa9d]">Modifiez puis cliquez sur Enregistrer</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setError(null);
            setOpen(false);
          }}
          className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
          title="Fermer sans enregistrer"
          aria-label="Fermer sans enregistrer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[calc(85vh-126px)]">
        <label className="text-xs block mb-1 text-[#c4ceb8]">Position de la barre administrateur</label>
        <select
          value={config.adminBarPosition || 'top'}
          onChange={(e) => {
            const position = e.target.value as AdminBarPosition;
            update({ adminBarPosition: position });
            requestAnimationFrame(() => applyAdminBarPosition(position));
          }}
          className="w-full rounded-lg bg-[#1c261e] border border-[#405044] px-3 py-2 mb-4 text-white cursor-pointer"
        >
          <option value="top">Haut</option>
          <option value="bottom">Bas</option>
          <option value="left">Gauche</option>
          <option value="right">Droite</option>
        </select>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button type="button" onClick={() => add('text')} className="rounded-lg bg-[#263329] p-2 text-xs cursor-pointer hover:bg-[#314034]"><Plus className="inline w-3 h-3" /> Texte</button>
          <button type="button" onClick={() => add('heading')} className="rounded-lg bg-[#263329] p-2 text-xs cursor-pointer hover:bg-[#314034]"><Plus className="inline w-3 h-3" /> Titre</button>
          <button type="button" onClick={() => add('button')} className="rounded-lg bg-[#263329] p-2 text-xs cursor-pointer hover:bg-[#314034]"><Plus className="inline w-3 h-3" /> Bouton</button>
        </div>

        {config.blocks.map((block) => (
          <div key={block.id} className="rounded-lg border border-[#334236] p-2 mb-2">
            <div className="flex gap-2">
              <input
                value={block.text || ''}
                onChange={(e) => update({ blocks: config.blocks.map((item) => item.id === block.id ? { ...item, text: e.target.value } : item) })}
                className="min-w-0 flex-1 rounded bg-[#0c110d] border border-[#354437] px-2 py-1 text-xs text-white"
              />
              <button type="button" onClick={() => update({ blocks: config.blocks.filter((item) => item.id !== block.id) })} className="text-red-300 cursor-pointer p-1" title="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-[#c4ceb8]">
              <label>
                X {Math.round(block.x)}%
                <input type="range" min="0" max="100" value={block.x} onChange={(e) => update({ blocks: config.blocks.map((item) => item.id === block.id ? { ...item, x: Number(e.target.value) } : item) })} className="w-full cursor-pointer" />
              </label>
              <label>
                Y {Math.round(block.y)}%
                <input type="range" min="0" max="100" value={block.y} onChange={(e) => update({ blocks: config.blocks.map((item) => item.id === block.id ? { ...item, y: Number(e.target.value) } : item) })} className="w-full cursor-pointer" />
              </label>
            </div>
          </div>
        ))}

        {!config.blocks.length && (
          <div className="rounded-lg border border-dashed border-[#405044] p-4 text-xs text-[#8e9b91] text-center mb-2">
            Aucun bloc ajouté. Utilisez les boutons ci-dessus pour créer du contenu.
          </div>
        )}
      </div>

      <div className="border-t border-[#334236] bg-[#172019] p-3">
        {error && <div className="mb-2 rounded-lg bg-red-950/50 border border-red-800/60 px-3 py-2 text-xs text-red-200">{error}</div>}
        {message && !error && <div className="mb-2 rounded-lg bg-emerald-950/40 border border-emerald-700/60 px-3 py-2 text-xs text-emerald-200"><Check className="inline w-3.5 h-3.5 mr-1" />{message}</div>}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="relative z-[2100] w-full rounded-lg bg-[#d4af37] text-black font-bold py-3 cursor-pointer hover:brightness-110 disabled:opacity-60 disabled:cursor-wait"
        >
          {saving ? <><Loader2 className="inline w-4 h-4 mr-1 animate-spin" />Enregistrement...</> : <><Save className="inline w-4 h-4 mr-1" />Enregistrer les modifications</>}
        </button>
      </div>
    </aside>
  );
};
