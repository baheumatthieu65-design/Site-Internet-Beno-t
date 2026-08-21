import React, { useState } from 'react';
import type { GiteSiteConfig } from '../types';
import { defaultGiteConfig } from '../data/giteConfig';
import { prepareImageForUpload } from '../utils/mediaUpload';
import { GiteFreeBlocksModal } from './GiteFreeBlocksModal';

interface Props { value?: GiteSiteConfig; onChange:(value:GiteSiteConfig)=>void; }

const panel='p-5 rounded-2xl bg-[#18201a] border border-[#3b4b3e] space-y-4';
const moduleOptions = [
  ['gite-hero','Le gîte — Accueil'],['gite-experience','Le gîte'],['gite-gallery','Galerie'],['gite-video','Vidéo'],
  ['gite-essentials','Équipements'],['gite-nearby','La région'],['gite-stay','Séjourner'],['gite-access','Accès'],
] as const;

export const GiteCustomizerPanel:React.FC<Props>=({value,onChange})=>{
  const [blocksOpen,setBlocksOpen]=useState(false);
  const [uploading,setUploading]=useState<string|null>(null);
  const c=value||defaultGiteConfig;
  const update=(patch:Partial<GiteSiteConfig>)=>onChange({...c,...patch});
  const updateModule=(id:string,patch:any)=>update({modules:c.modules.map(m=>m.id===id?{...m,...patch}:m)});

  const uploadModuleBackground=async(id:string,file:File)=>{
    setUploading(id);
    try{
      const prepared=await prepareImageForUpload(file);
      const form=new FormData(); form.append('file',prepared);
      const r=await fetch('/api/site-media',{method:'POST',credentials:'include',body:form});
      const d=await r.json().catch(()=>null);
      if(!r.ok||!d?.url) throw new Error(d?.error||`Upload : HTTP ${r.status}`);
      const current=c.modules.find(m=>m.id===id)?.background;
      updateModule(id,{background:{type:'image',url:String(d.url),overlay:current?.overlay??20,objectFit:'cover',positionX:50,positionY:50}});
    }catch(e){alert(e instanceof Error?e.message:'Upload impossible.')}
    finally{setUploading(null)}
  };

  return <>
    <div className="space-y-6">
      <div className={panel}>
        <div>
          <h4 className="font-serif text-lg text-[#f3ece0]">Page Gîte — contenus</h4>
          <p className="text-xs text-[#a3b1a5]">Éditeur indépendant de la Boutique. Ici tu règles les contenus structurants de la page Gîte.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {([['name','Nom du gîte'],['location','Lieu / région'],['tagline','Accroche']] as const).map(([k,l])=>
            <label key={k} className="text-xs text-[#a3b1a5]">{l}
              <input value={(c as any)[k]||''} onChange={e=>update({[k]:e.target.value} as any)} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white"/>
            </label>
          )}
        </div>
        <label className="text-xs text-[#a3b1a5] block">Image principale du gîte
          <input value={c.heroImage||''} onChange={e=>update({heroImage:e.target.value})} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white"/>
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-xs text-[#a3b1a5]">Titre « Le gîte »
            <input value={c.intro.title} onChange={e=>update({intro:{...c.intro,title:e.target.value}})} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white"/>
          </label>
          <label className="text-xs text-[#a3b1a5]">Texte « Le gîte »
            <textarea value={c.intro.text} onChange={e=>update({intro:{...c.intro,text:e.target.value}})} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white min-h-24"/>
          </label>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-[#d4af37]/60 bg-gradient-to-br from-[#1c271e] to-[#131913] shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="font-serif text-lg text-[#f3ece0]">Éléments libres sur la page</h4>
            <p className="text-xs text-[#a3b1a5] mt-1 max-w-2xl">Les zones libres ne sont plus mélangées aux réglages généraux du Gîte. Ouvre leur éditeur dans une bulle dédiée pour créer, déplacer et styliser chaque élément.</p>
          </div>
          <button type="button" onClick={()=>setBlocksOpen(true)} className="shrink-0 px-4 py-3 rounded-xl bg-[#d4af37] text-[#111612] font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110">
            + Ouvrir l’éditeur des zones libres
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] uppercase tracking-widest text-[#9eb0a0]">
          <span className="rounded-lg bg-[#101510] border border-[#344437] px-2 py-2 text-center">Texte</span>
          <span className="rounded-lg bg-[#101510] border border-[#344437] px-2 py-2 text-center">Titre</span>
          <span className="rounded-lg bg-[#101510] border border-[#344437] px-2 py-2 text-center">Image</span>
          <span className="rounded-lg bg-[#101510] border border-[#344437] px-2 py-2 text-center">Vidéo</span>
          <span className="rounded-lg bg-[#101510] border border-[#344437] px-2 py-2 text-center">Bouton</span>
        </div>
      </div>

      <div className={panel}>
        <h4 className="font-serif text-lg text-[#f3ece0]">Galerie & vidéo principale</h4>
        <div className="grid md:grid-cols-2 gap-4">
          {c.gallery.map((g,i)=><div key={i} className="bg-[#101510] rounded-xl p-3 space-y-2">
            <img src={g.src} alt="" className="w-full h-28 object-cover rounded-lg"/>
            <input value={g.src} onChange={e=>{const gallery=[...c.gallery];gallery[i]={...gallery[i],src:e.target.value};update({gallery})}} className="w-full bg-[#18201a] border border-[#344237] rounded-lg px-2 py-2 text-white text-xs"/>
            <input value={g.alt} onChange={e=>{const gallery=[...c.gallery];gallery[i]={...gallery[i],alt:e.target.value};update({gallery})}} className="w-full bg-[#18201a] border border-[#344237] rounded-lg px-2 py-2 text-white text-xs"/>
          </div>)}
        </div>
        <label className="text-xs text-[#a3b1a5] block">URL vidéo principale (MP4/WebM)
          <input value={c.videoUrl||''} onChange={e=>update({videoUrl:e.target.value})} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white"/>
        </label>
      </div>

      <div className={panel}>
        <h4 className="font-serif text-lg text-[#f3ece0]">Ordre, visibilité & fonds des modules</h4>
        {c.modules.map(m=><div key={m.id} className="bg-[#101510] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <strong className="text-white text-sm">{m.label}</strong>
            <label className="text-xs text-[#a3b1a5] flex gap-2 items-center"><input type="checkbox" checked={m.visible} onChange={e=>updateModule(m.id,{visible:e.target.checked})}/> Visible</label>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-xs text-[#a3b1a5]">Image de fond
              <input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)void uploadModuleBackground(m.id,f)}} className="mt-2 text-xs text-[#a3b1a5]"/>
              {m.background?.url&&<img src={m.background.url} alt="" className="mt-2 w-full h-24 object-cover rounded-lg"/>}
              {uploading===m.id&&<span className="block mt-1 text-[#d4af37]">Import en cours…</span>}
            </label>
            <label className="text-xs text-[#a3b1a5]">URL image de fond
              <input value={m.background?.url||''} onChange={e=>updateModule(m.id,{background:{...(m.background||{type:'image'}),type:'image',url:e.target.value}})} className="mt-2 w-full bg-[#18201a] border border-[#344237] rounded-lg px-2 py-2 text-white"/>
            </label>
          </div>
          <label className="text-xs text-[#a3b1a5] block">Opacité du fond
            <input type="range" min="0" max="100" value={m.background?.overlay??20} onChange={e=>updateModule(m.id,{background:{...(m.background||{type:'image'}),overlay:Number(e.target.value)}})} className="w-full accent-[#d4af37]"/>
          </label>
        </div>)}
      </div>
    </div>
    <GiteFreeBlocksModal isOpen={blocksOpen} onClose={()=>setBlocksOpen(false)} value={c} onChange={onChange}/>
  </>;
};

export default GiteCustomizerPanel;
