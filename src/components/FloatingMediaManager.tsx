import React from "react";
import type { FloatingMediaItem } from "../data/floatingMedia";

type Props = {
  config: any;
  onChange: (next: any) => void;
};

const fallbackSections: [string, string][] = [
  ["hero", "Hero / Accueil"],
  ["collection", "Collection / Articles"],
  ["comparatif", "Tableau comparatif"],
  ["origines", "L’esprit Pyrénées"],
  ["lookbook", "Lookbook"],
  ["contact", "Contact & Atelier"],
  ["gite-hero", "Gîte — Accueil"],
  ["gite-presentation", "Gîte — Présentation"],
  ["gite-gallery", "Gîte — Galerie photos"],
  ["gite-video", "Gîte — Vidéo"],
  ["gite-amenities", "Gîte — Équipements"],
  ["gite-location", "Gîte — Localisation / Accès"],
  ["gite-surroundings", "Gîte — Aux alentours"],
  ["gite-booking", "Gîte — Séjourner / Airbnb / Booking"],
  ["gite-contact", "Gîte — Contact"],
];

const makeId = () => `floating-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const readImageFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("Lecture de l'image impossible"));
    reader.readAsDataURL(file);
  });

export const FloatingMediaManager: React.FC<Props> = ({ config, onChange }) => {
  const items: FloatingMediaItem[] = config?.floatingImages ?? [];
  const rawBlocks = Array.isArray(config?.blocks) ? config.blocks : [];
  const fromBlocks: [string,string][] = rawBlocks
    .map((b:any) => {
      const id = b.section ?? b.id ?? b.key;
      const label = b.label ?? b.title ?? id;
      return id ? [String(id), String(label)] as [string,string] : null;
    })
    .filter(Boolean) as [string,string][];

  const seen = new Set<string>();
  const sections: [string,string][] = [...fromBlocks, ...fallbackSections]
    .filter(([id]) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

  const update = (id:string, patch:Partial<FloatingMediaItem>) =>
    onChange({...config, floatingImages: items.map(i => i.id === id ? {...i, ...patch} : i)});

  const add = () => {
    const section = sections[0]?.[0] ?? "hero";
    onChange({...config, floatingImages:[...items,{
      id:makeId(), section, url:"", alt:"", x:88, y:50, size:160, rotate:0,
      opacity:100, animation:"float", mobile:true, visible:true
    }]});
  };

  const remove = (id:string) =>
    onChange({...config, floatingImages:items.filter(i=>i.id!==id)});

  return (
    <div className="space-y-3" data-floating-manager="true">
      <button type="button" onClick={add}
        className="w-full rounded-lg border border-[#d4af37]/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/10">
        + Ajouter une image flottante
      </button>

      {!items.length && (
        <div className="rounded-lg border border-dashed border-[#455248] p-3 text-center text-xs text-[#87968a]">
          Aucune image flottante. Ajoutez-en une puis choisissez le module auquel elle doit être attachée.
        </div>
      )}

      {items.map(item => (
        <div key={item.id} className="rounded-xl border border-[#3b473e] bg-[#151b17] p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-sm text-[#e8e1d5]">Image flottante</strong>
            <button type="button" onClick={()=>remove(item.id)} className="text-xs text-red-300 hover:text-red-100">Supprimer</button>
          </div>

          <input value={item.url} onChange={e=>update(item.id,{url:e.target.value})}
            placeholder="URL de l'image..." className="w-full rounded-lg border border-[#3b473e] bg-[#101511] px-3 py-2 text-sm"/>
          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer rounded-lg border border-[#d4af37]/50 bg-[#151b17] px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/10">
              Choisir une image sur mon PC
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="sr-only"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const dataUrl = await readImageFile(file);
                    update(item.id, { url: dataUrl });
                  } catch {
                    window.alert("Impossible de lire cette image.");
                  }
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {item.url && (
              <button
                type="button"
                onClick={() => update(item.id, { url: "" })}
                className="rounded-lg border border-[#6b3939] px-3 py-2 text-xs text-red-300 hover:bg-red-950/20"
              >
                Effacer
              </button>
            )}
          </div>
          {item.url && (
            <div className="overflow-hidden rounded-lg border border-[#3b473e] bg-[#0d110e] p-2">
              <img src={item.url} alt="" className="mx-auto max-h-28 max-w-full object-contain" />
            </div>
          )}

          <label className="block text-xs text-[#9eaaa0]">
            Module
            <select value={item.section} onChange={e=>update(item.id,{section:e.target.value})}
              className="mt-1 w-full rounded-lg border border-[#3b473e] bg-[#101511] px-3 py-2 text-sm text-[#e8e1d5]">
              {sections.map(([id,label])=><option key={id} value={id}>{label}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-[#9eaaa0]">Taille : {item.size}px
              <input type="range" min="40" max="600" value={item.size} onChange={e=>update(item.id,{size:+e.target.value})} className="w-full"/>
            </label>
            <label className="text-xs text-[#9eaaa0]">Opacité : {item.opacity}%
              <input type="range" min="0" max="100" value={item.opacity} onChange={e=>update(item.id,{opacity:+e.target.value})} className="w-full"/>
            </label>
            <label className="text-xs text-[#9eaaa0]">Position X : {item.x}%
              <input type="range" min="0" max="100" value={item.x} onChange={e=>update(item.id,{x:+e.target.value})} className="w-full"/>
            </label>
            <label className="text-xs text-[#9eaaa0]">Position Y : {item.y}%
              <input type="range" min="0" max="100" value={item.y} onChange={e=>update(item.id,{y:+e.target.value})} className="w-full"/>
            </label>
            <label className="text-xs text-[#9eaaa0]">Rotation : {item.rotate}°
              <input type="range" min="-45" max="45" value={item.rotate} onChange={e=>update(item.id,{rotate:+e.target.value})} className="w-full"/>
            </label>
          </div>

          <select value={item.animation} onChange={e=>update(item.id,{animation:e.target.value as FloatingMediaItem["animation"]})}
            className="w-full rounded-lg border border-[#3b473e] bg-[#101511] px-3 py-2 text-sm text-[#e8e1d5]">
            <option value="none">Aucune animation</option>
            <option value="float">Flottement doux</option>
            <option value="sway">Balancement doux</option>
          </select>

          <div className="flex flex-wrap gap-4 text-xs text-[#c4ceb8]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={item.visible} onChange={e=>update(item.id,{visible:e.target.checked})}/> Visible</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={item.mobile} onChange={e=>update(item.id,{mobile:e.target.checked})}/> Mobile</label>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingMediaManager;
