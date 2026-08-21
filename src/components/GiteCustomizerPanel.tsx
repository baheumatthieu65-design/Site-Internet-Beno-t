import React, { useState } from 'react';
import type { GiteSiteConfig } from '../types';
import { defaultGiteConfig } from '../data/giteConfig';
import { prepareImageForUpload } from '../utils/mediaUpload';


interface Props { value?: GiteSiteConfig; onChange:(value:GiteSiteConfig)=>void; }
const panel='p-5 rounded-2xl bg-[#18201a] border border-[#3b4b3e] space-y-4';

export const GiteCustomizerPanel:React.FC<Props>=({value,onChange})=>{
  const [uploading,setUploading]=useState<string|null>(null);
  const c=value||defaultGiteConfig;
  const update=(patch:Partial<GiteSiteConfig>)=>onChange({...c,...patch});
  const updateModule=(id:string, patch:any)=>update({modules:c.modules.map(m=>m.id===id?{...m,...patch}:m)});
  const upload=async(id:string,file:File,type:'image'|'video')=>{
    setUploading(id); try{
      const prepared=type==='image'?await prepareImageForUpload(file):file;
      const form=new FormData(); form.append('file',prepared);
      const r=await fetch('/api/site-media',{method:'POST',credentials:'include',body:form});
      const d=await r.json().catch(()=>null); if(!r.ok||!d?.url) throw new Error(d?.error||`Upload : HTTP ${r.status}`);
      const current=c.modules.find(m=>m.id===id)?.background;
      updateModule(id,{background:{type,url:String(d.url),overlay:current?.overlay??20}});
    }catch(e){alert(e instanceof Error?e.message:'Upload impossible.')}finally{setUploading(null)}
  };

  return <div className="space-y-6">
    <div className={panel}><div><h4 className="font-serif text-lg text-[#f3ece0]">Page Gîte — contenus</h4><p className="text-xs text-[#a3b1a5]">Configuration indépendante de la Boutique. Les zones libres se gèrent depuis l’éditeur visuel du site.</p></div>
      <div className="grid md:grid-cols-2 gap-4">{([['name','Nom du gîte'],['location','Lieu / région'],['tagline','Accroche'] ] as const).map(([k,l])=><label key={k} className="text-xs text-[#a3b1a5]">{l}<input value={(c as any)[k]||''} onChange={e=>update({[k]:e.target.value} as any)} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white"/></label>)}</div>
      <label className="text-xs text-[#a3b1a5] block">Image principale du gîte<input value={c.heroImage} onChange={e=>update({heroImage:e.target.value})} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white"/></label>
      <div className="grid md:grid-cols-2 gap-4"><label className="text-xs text-[#a3b1a5]">Titre « Le gîte »<input value={c.intro.title} onChange={e=>update({intro:{...c.intro,title:e.target.value}})} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white"/></label><label className="text-xs text-[#a3b1a5]">Texte « Le gîte »<textarea value={c.intro.text} onChange={e=>update({intro:{...c.intro,text:e.target.value}})} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white min-h-24"/></label></div>
    </div>

    <div className={panel}><h4 className="font-serif text-lg text-[#f3ece0]">Galerie & vidéo principale</h4><div className="grid md:grid-cols-2 gap-4">{c.gallery.map((g,i)=><div key={i} className="bg-[#101510] rounded-xl p-3 space-y-2"><img src={g.src} alt="" className="w-full h-28 object-cover rounded-lg"/><input value={g.src} onChange={e=>{const gallery=[...c.gallery];gallery[i]={...gallery[i],src:e.target.value};update({gallery})}} className="w-full bg-[#18201a] border border-[#344237] rounded-lg px-2 py-2 text-white text-xs"/><input value={g.alt} onChange={e=>{const gallery=[...c.gallery];gallery[i]={...gallery[i],alt:e.target.value};update({gallery})}} className="w-full bg-[#18201a] border border-[#344237] rounded-lg px-2 py-2 text-white text-xs"/></div>)}</div><label className="text-xs text-[#a3b1a5] block">URL vidéo (MP4/WebM)<input value={c.videoUrl||''} onChange={e=>update({videoUrl:e.target.value})} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white"/></label></div>

    <div className={panel}><h4 className="font-serif text-lg text-[#f3ece0]">Ordre, visibilité & fonds des modules</h4>{c.modules.map((m,idx)=><div key={m.id} className="bg-[#101510] rounded-xl p-4 space-y-3"><div className="flex items-center justify-between"><strong className="text-white text-sm">{m.label}</strong><label className="text-xs text-[#a3b1a5] flex gap-2 items-center"><input type="checkbox" checked={m.visible} onChange={e=>updateModule(m.id,{visible:e.target.checked})}/> Visible</label></div><div className="grid md:grid-cols-3 gap-3"><button disabled={idx===0} onClick={()=>{const modules=[...c.modules];[modules[idx-1],modules[idx]]=[modules[idx],modules[idx-1]];update({modules})}} className="px-3 py-2 rounded-lg bg-[#263128] text-white disabled:opacity-30">↑ Monter</button><button disabled={idx===c.modules.length-1} onClick={()=>{const modules=[...c.modules];[modules[idx+1],modules[idx]]=[modules[idx],modules[idx+1]];update({modules})}} className="px-3 py-2 rounded-lg bg-[#263128] text-white disabled:opacity-30">↓ Descendre</button><select value={m.background?.type||'none'} onChange={e=>e.target.value==='none'?updateModule(m.id,{background:undefined}):updateModule(m.id,{background:{type:e.target.value,url:m.background?.url||'',overlay:m.background?.overlay??20}})} className="bg-[#18201a] text-white rounded-lg px-2"><option value="none">Sans fond</option><option value="image">Image</option><option value="video">Vidéo</option></select></div>{m.background&&<><div className="flex gap-3 items-center"><input type="file" accept={m.background.type==='video'?'.mp4,.webm,video/mp4,video/webm':'image/*'} onChange={e=>{const f=e.target.files?.[0];if(f) void upload(m.id,f,m.background!.type as any)}} className="text-xs text-[#a3b1a5]"/><span className="text-xs text-[#a3b1a5]">{uploading===m.id?'Upload…':'Importer depuis le PC'}</span></div><input value={m.background.url} onChange={e=>updateModule(m.id,{background:{...m.background!,url:e.target.value}})} placeholder="URL du média" className="w-full bg-[#18201a] border border-[#344237] rounded-lg px-2 py-2 text-white text-xs"/><label className="text-xs text-[#a3b1a5]">Opacité du voile : {m.background.overlay??20}%<input type="range" min="0" max="100" value={m.background.overlay??20} onChange={e=>updateModule(m.id,{background:{...m.background!,overlay:Number(e.target.value)}})} className="w-full"/></label>{m.background.url&&m.background.type==='image'&&<img src={m.background.url} alt="Aperçu" className="w-full h-24 object-cover rounded-lg"/>}{m.background.url&&m.background.type==='video'&&<video src={m.background.url} muted controls className="w-full h-24 object-cover rounded-lg"/>}</>}</div>)}</div>

    <div className={panel}><h4 className="font-serif text-lg text-[#f3ece0]">Navigation Gîte</h4><div className="grid md:grid-cols-2 gap-3">{(['experience','gallery','video','nearby','stay'] as const).map(k=><label key={k} className="text-xs text-[#a3b1a5]">{k}<input value={c.navLabels?.[k]||''} onChange={e=>update({navLabels:{...(c.navLabels||{}),[k]:e.target.value}})} className="mt-2 w-full bg-[#101510] border border-[#344237] rounded-xl px-3 py-2 text-white"/></label>)}</div></div>
  </div>;
};
