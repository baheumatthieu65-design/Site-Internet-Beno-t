import React, { useState } from 'react';
import { ImagePlus, Save, X } from 'lucide-react';

export type EditableMediaKind='image'|'gif'|'video';
export interface EditableMediaValue { type:EditableMediaKind; url:string; poster?:string; overlay?:number; positionX?:number; positionY?:number; }
interface Props { value:EditableMediaValue; isAdmin?:boolean; onSave:(value:EditableMediaValue)=>Promise<void>|void; className?:string; }

export const EditableMedia:React.FC<Props>=({value,isAdmin=false,onSave,className=''})=>{
 const [open,setOpen]=useState(false),[draft,setDraft]=useState(value);
 const save=async()=>{await onSave({...draft,overlay:Number(draft.overlay??.35),positionX:Number(draft.positionX??50),positionY:Number(draft.positionY??50)});setOpen(false)};
 const preview=value.type==='video'?<video src={value.url} poster={value.poster} autoPlay muted loop playsInline className={`w-full h-full object-cover ${className}`}/>:<img src={value.url} alt="" className={`w-full h-full object-cover ${className}`}/>;
 if(!isAdmin)return preview;
 return <><button type="button" onClick={()=>{setDraft(value);setOpen(true)}} className="relative block w-full h-full group">{preview}<span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/45"><span className="opacity-0 group-hover:opacity-100 rounded-full bg-[#d4af37] text-black px-3 py-2 text-xs font-bold"><ImagePlus className="inline w-4 h-4 mr-1"/>Modifier</span></span></button>
 {open&&<div className="fixed inset-0 z-[500] bg-black/70 flex items-center justify-center p-4"><div className="w-full max-w-xl rounded-2xl bg-[#172019] border border-[#d4af37]/60 p-5 text-white">
 <div className="flex justify-between mb-4"><strong className="text-[#d4af37]">Média</strong><button onClick={()=>setOpen(false)}><X/></button></div>
 <select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as EditableMediaKind})} className="w-full mb-3 rounded-lg bg-[#0f140f] border border-[#405044] px-3 py-2"><option value="image">Image</option><option value="gif">GIF</option><option value="video">Vidéo MP4/WebM</option></select>
 <input value={draft.url} onChange={e=>setDraft({...draft,url:e.target.value})} placeholder="/media/hero.mp4 ou URL https://..." className="w-full mb-3 rounded-lg bg-[#0f140f] border border-[#405044] px-3 py-2"/>
 {draft.type==='video'&&<input value={draft.poster||''} onChange={e=>setDraft({...draft,poster:e.target.value})} placeholder="Poster vidéo (optionnel)" className="w-full mb-3 rounded-lg bg-[#0f140f] border border-[#405044] px-3 py-2"/>}
 <label className="block text-xs">Assombrissement {Math.round((draft.overlay??.35)*100)}%</label><input type="range" min="0" max=".8" step=".05" value={draft.overlay??.35} onChange={e=>setDraft({...draft,overlay:Number(e.target.value)})} className="w-full mb-3"/>
 <label className="block text-xs">Position X {draft.positionX??50}%</label><input type="range" min="0" max="100" value={draft.positionX??50} onChange={e=>setDraft({...draft,positionX:Number(e.target.value)})} className="w-full mb-3"/>
 <label className="block text-xs">Position Y {draft.positionY??50}%</label><input type="range" min="0" max="100" value={draft.positionY??50} onChange={e=>setDraft({...draft,positionY:Number(e.target.value)})} className="w-full mb-4"/>
 <div className="flex justify-end gap-2"><button onClick={()=>setOpen(false)} className="px-4 py-2 rounded-lg bg-[#273329]">Annuler</button><button onClick={()=>void save()} className="px-4 py-2 rounded-lg bg-[#d4af37] text-black font-bold"><Save className="inline w-4 h-4 mr-1"/>Enregistrer</button></div>
 </div></div>}</>;
};
