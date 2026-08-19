import React from "react";
import type { FloatingMediaItem } from "../data/floatingMedia";

type Props = { config: any; onChange: (next: any) => void };

const makeId = () => `floating-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export const FloatingMediaManager: React.FC<Props> = ({ config, onChange }) => {
  const items: FloatingMediaItem[] = config?.floatingImages ?? [];
  const modules = config?.editableBlocks ?? config?.blocks ?? [];
  const moduleOptions = Array.isArray(modules) && modules.length
    ? modules.map((m:any) => ({ id: m.id ?? m.key, label: m.label ?? m.title ?? m.id ?? m.key }))
    : [
      {id:"hero",label:"Hero"},{id:"collection",label:"Collection"},{id:"comparatif",label:"Comparatif"},
      {id:"origines",label:"Origines"},{id:"lookbook",label:"Lookbook"},{id:"contact",label:"Contact & Atelier"}
    ];

  const update = (id:string, patch:Partial<FloatingMediaItem>) =>
    onChange({...config, floatingImages: items.map(i => i.id === id ? {...i, ...patch} : i)});

  const add = () => {
    const moduleId = moduleOptions[0]?.id ?? "hero";
    onChange({...config, floatingImages:[...items,{
      id:makeId(), moduleId, src:"", alt:"", x:90, y:50, size:160, rotate:0,
      animation:"float", mobileVisible:true
    }]});
  };

  const remove = (id:string) =>
    onChange({...config, floatingImages:items.filter(i=>i.id!==id)});

  return <div className="space-y-3">
    <button type="button" onClick={add}
      className="w-full rounded-lg border border-[#d4af37]/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/10">
      + Ajouter une image flottante
    </button>
    {items.map(item => <div key={item.id} className="rounded-xl border border-[#3b473e] p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm text-[#e8e1d5]">Image flottante</strong>
        <button type="button" onClick={()=>remove(item.id)} className="text-xs text-red-300">Supprimer</button>
      </div>
      <input value={item.src} onChange={e=>update(item.id,{src:e.target.value})}
        placeholder="URL de l'image..." className="w-full rounded-lg border border-[#3b473e] bg-[#151b17] px-3 py-2 text-sm"/>
      <input value={item.alt ?? ""} onChange={e=>update(item.id,{alt:e.target.value})}
        placeholder="Texte alternatif..." className="w-full rounded-lg border border-[#3b473e] bg-[#151b17] px-3 py-2 text-sm"/>
      <select value={item.moduleId} onChange={e=>update(item.id,{moduleId:e.target.value})}
        className="w-full rounded-lg border border-[#3b473e] bg-[#151b17] px-3 py-2 text-sm">
        {moduleOptions.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-[#9eaaa0]">Taille
          <input type="range" min="40" max="500" value={item.size} onChange={e=>update(item.id,{size:+e.target.value})} className="w-full"/>
        </label>
        <label className="text-xs text-[#9eaaa0]">Rotation
          <input type="range" min="-45" max="45" value={item.rotate} onChange={e=>update(item.id,{rotate:+e.target.value})} className="w-full"/>
        </label>
        <label className="text-xs text-[#9eaaa0]">Position X
          <input type="range" min="0" max="100" value={item.x} onChange={e=>update(item.id,{x:+e.target.value})} className="w-full"/>
        </label>
        <label className="text-xs text-[#9eaaa0]">Position Y
          <input type="range" min="0" max="100" value={item.y} onChange={e=>update(item.id,{y:+e.target.value})} className="w-full"/>
        </label>
      </div>
      <select value={item.animation} onChange={e=>update(item.id,{animation:e.target.value as FloatingMediaItem["animation"]})}
        className="w-full rounded-lg border border-[#3b473e] bg-[#151b17] px-3 py-2 text-sm">
        <option value="none">Aucune animation</option>
        <option value="float">Flottement doux</option>
        <option value="sway">Balancement</option>
      </select>
      <label className="flex items-center gap-2 text-xs text-[#c4ceb8]">
        <input type="checkbox" checked={item.mobileVisible} onChange={e=>update(item.id,{mobileVisible:e.target.checked})}/>
        Afficher sur mobile
      </label>
    </div>)}
  </div>;
};

export default FloatingMediaManager;
