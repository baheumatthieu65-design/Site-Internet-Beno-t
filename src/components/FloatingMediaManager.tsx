import React, { useState } from "react";
import type { SiteEditorConfig } from "./SiteVisualEditor";
import type { FloatingMedia } from "./FloatingMediaLayer";
import { Image as ImageIcon, Plus, Trash2 } from "lucide-react";

const sections = [
  ["hero","Accueil"],["collection","Les 2 vestes"],["comparatif","Tableau comparatif"],
  ["origines","L'esprit Pyrénées"],["lookbook","Lookbook"],["contact","Contact & Atelier"]
];

export const FloatingMediaManager: React.FC<{config:SiteEditorConfig;onChange:(c:SiteEditorConfig)=>void}> = ({config,onChange}) => {
  const [url,setUrl]=useState("");
  const items = config.floatingImages || [];
  const add = () => {
    if(!url.trim()) return;
    const next: FloatingMedia = {
      id:`floating-${Date.now()}`, section:"hero", url:url.trim(), x:50, y:50,
      size:180, rotate:0, opacity:100, animation:"float", mobile:true, visible:true
    };
    onChange({...config,floatingImages:[...items,next]});
    setUrl("");
  };
  const update=(id:string,patch:Partial<FloatingMedia>)=>onChange({...config,floatingImages:items.map(i=>i.id===id?{...i,...patch}:i)});
  const remove=(id:string)=>onChange({...config,floatingImages:items.filter(i=>i.id!==id)});
  return <div className="rounded-xl border border-[#39483e] p-3 space-y-3" data-vce-ignore="true">
    <div className="flex items-center gap-2 text-sm font-semibold"><ImageIcon size={16}/> Images décoratives flottantes</div>
    <div className="flex gap-2">
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="URL de l'image…" className="min-w-0 flex-1 rounded-lg bg-[#1b231e] border border-[#455248] px-3 py-2 text-sm"/>
      <button type="button" onClick={add} className="rounded-lg bg-[#d4af37] px-3 text-black"><Plus size={17}/></button>
    </div>
    {items.map(i=><div key={i.id} className="rounded-lg border border-[#455248] p-3 space-y-2">
      <div className="flex items-center justify-between gap-2"><span className="truncate text-xs">{i.url}</span><button type="button" onClick={()=>remove(i.id)}><Trash2 size={15}/></button></div>
      <select value={i.section} onChange={e=>update(i.id,{section:e.target.value})} className="w-full rounded bg-[#1b231e] border border-[#455248] p-2 text-xs">{sections.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <label>X<input type="number" value={i.x} onChange={e=>update(i.id,{x:+e.target.value})} className="w-full rounded bg-[#1b231e] p-2"/></label>
        <label>Y<input type="number" value={i.y} onChange={e=>update(i.id,{y:+e.target.value})} className="w-full rounded bg-[#1b231e] p-2"/></label>
        <label>Taille<input type="number" value={i.size} onChange={e=>update(i.id,{size:+e.target.value})} className="w-full rounded bg-[#1b231e] p-2"/></label>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <label>Rotation<input type="number" value={i.rotate} onChange={e=>update(i.id,{rotate:+e.target.value})} className="w-full rounded bg-[#1b231e] p-2"/></label>
        <label>Opacité<input type="number" min="0" max="100" value={i.opacity} onChange={e=>update(i.id,{opacity:+e.target.value})} className="w-full rounded bg-[#1b231e] p-2"/></label>
        <label>Animation<select value={i.animation} onChange={e=>update(i.id,{animation:e.target.value as FloatingMedia["animation"]})} className="w-full rounded bg-[#1b231e] p-2"><option value="none">Aucune</option><option value="float">Flottement</option><option value="sway">Oscillation</option></select></label>
      </div>
      <div className="flex gap-4 text-xs">
        <label><input type="checkbox" checked={i.visible} onChange={e=>update(i.id,{visible:e.target.checked})}/> Visible</label>
        <label><input type="checkbox" checked={i.mobile} onChange={e=>update(i.id,{mobile:e.target.checked})}/> Mobile</label>
      </div>
    </div>)}
  </div>;
};
