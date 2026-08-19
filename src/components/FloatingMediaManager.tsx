import React from "react";
import type { FloatingMediaItem } from "../data/floatingMedia";

type Props = {
  config: any;
  onChange: (next: any) => void;
};

const fallbackSections = [
  ["hero", "Accueil & Bannière"],
  ["collection", "Les 2 Vestes"],
  ["comparatif", "Tableau Comparatif"],
  ["origines", "L’Esprit Pyrénées"],
  ["lookbook", "Lookbook"],
  ["contact", "Contact & Atelier"],
];

const makeId = () => `floating-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export const FloatingMediaManager: React.FC<Props> = ({ config, onChange }) => {
  const items: FloatingMediaItem[] = config?.floatingImages ?? [];
  const rawBlocks = Array.isArray(config?.blocks) ? config.blocks : [];
  const fromBlocks = rawBlocks
    .map((b:any) => b.section)
    .filter(Boolean)
    .filter((v:any,i:number,a:any[]) => a.indexOf(v) === i)
    .map((id:string) => [id, id] as [string,string]);
  const sections: [string,string][] = fromBlocks.length ? fromBlocks : fallbackSections as [string,string][];

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
