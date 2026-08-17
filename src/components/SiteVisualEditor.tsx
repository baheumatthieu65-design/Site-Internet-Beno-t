import React,{useState} from 'react';
import {Plus,Save,Settings2,Trash2} from 'lucide-react';
import type {BrandConfig,SectionId} from '../types';

export type AdminBarPosition='top'|'bottom'|'left'|'right';
export interface EditorBlock {id:string;type:'text'|'heading'|'button'|'image'|'video'|'spacer';section:SectionId;x:number;y:number;text?:string;url?:string;visible:boolean;}
export interface SiteEditorConfig {adminBarPosition:AdminBarPosition;heroBackground?:{type:'image'|'gif'|'video';url:string;poster?:string;overlay?:number;positionX?:number;positionY?:number};blocks:EditorBlock[];}
interface Props {brandData:BrandConfig;config:SiteEditorConfig;onChange:(c:SiteEditorConfig)=>void;onSave:()=>Promise<void>|void;}

export const SiteVisualEditor:React.FC<Props>=({config,onChange,onSave})=>{
 const [open,setOpen]=useState(false);
 const update=(p:Partial<SiteEditorConfig>)=>onChange({...config,...p});
 const add=(type:EditorBlock['type'])=>update({blocks:[...config.blocks,{id:`block-${Date.now()}`,type,section:'hero',x:50,y:55,text:type==='button'?'Nouveau bouton':type==='heading'?'Nouveau titre':'Nouveau texte',url:type==='button'?'#':undefined,visible:true}]});
 if(!open)return <button type="button" onClick={()=>setOpen(true)} className="fixed bottom-4 right-4 z-[250] rounded-full bg-[#d4af37] text-black p-3 shadow-2xl" title="Éditeur visuel"><Settings2 className="w-5 h-5"/></button>;
 return <aside className="fixed bottom-4 right-4 z-[250] w-[min(420px,calc(100vw-2rem))] max-h-[80vh] overflow-auto rounded-2xl bg-[#111711]/95 text-white border border-[#d4af37]/60 shadow-2xl p-4">
  <div className="flex justify-between mb-3"><strong className="text-[#d4af37]">Éditeur visuel</strong><button onClick={()=>setOpen(false)}>Fermer</button></div>
  <label className="text-xs block mb-1">Position barre administrateur</label>
  <select value={config.adminBarPosition} onChange={e=>update({adminBarPosition:e.target.value as AdminBarPosition})} className="w-full rounded-lg bg-[#1c261e] border border-[#405044] px-2 py-2 mb-4"><option value="top">Haut</option><option value="bottom">Bas</option><option value="left">Gauche</option><option value="right">Droite</option></select>
  <div className="grid grid-cols-3 gap-2 mb-4"><button onClick={()=>add('text')} className="rounded-lg bg-[#263329] p-2 text-xs"><Plus className="inline w-3 h-3"/> Texte</button><button onClick={()=>add('heading')} className="rounded-lg bg-[#263329] p-2 text-xs"><Plus className="inline w-3 h-3"/> Titre</button><button onClick={()=>add('button')} className="rounded-lg bg-[#263329] p-2 text-xs"><Plus className="inline w-3 h-3"/> Bouton</button></div>
  {config.blocks.map(b=><div key={b.id} className="rounded-lg border border-[#334236] p-2 mb-2"><div className="flex gap-2"><input value={b.text||''} onChange={e=>update({blocks:config.blocks.map(x=>x.id===b.id?{...x,text:e.target.value}:x)})} className="min-w-0 flex-1 rounded bg-[#0c110d] border border-[#354437] px-2 py-1 text-xs"/><button onClick={()=>update({blocks:config.blocks.filter(x=>x.id!==b.id)})} className="text-red-300"><Trash2 className="w-4 h-4"/></button></div><div className="grid grid-cols-2 gap-2 mt-2 text-[10px]"><label>X {Math.round(b.x)}%<input type="range" min="0" max="100" value={b.x} onChange={e=>update({blocks:config.blocks.map(x=>x.id===b.id?{...x,x:Number(e.target.value)}:x)})} className="w-full"/></label><label>Y {Math.round(b.y)}%<input type="range" min="0" max="100" value={b.y} onChange={e=>update({blocks:config.blocks.map(x=>x.id===b.id?{...x,y:Number(e.target.value)}:x)})} className="w-full"/></label></div></div>)}
  <button onClick={()=>void onSave()} className="w-full rounded-lg bg-[#d4af37] text-black font-bold py-2"><Save className="inline w-4 h-4 mr-1"/>Sauvegarder</button>
 </aside>;
};
