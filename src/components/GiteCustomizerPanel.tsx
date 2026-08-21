import React, { useMemo, useState } from 'react';
import type { GiteModuleConfig, GiteSiteConfig } from '../types';
import { defaultGiteConfig } from '../data/giteConfig';
import { prepareImageForUpload } from '../utils/mediaUpload';
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react';

interface Props { value?: GiteSiteConfig; onChange:(value:GiteSiteConfig)=>void; }
const panel='p-5 rounded-2xl bg-[#18201a] border border-[#3b4b3e] space-y-4';
const makeId = () => `gite-module-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

export const GiteCustomizerPanel:React.FC<Props>=({value,onChange})=>{
  const [uploading,setUploading]=useState<string|null>(null);
  const c=value||defaultGiteConfig;
  const modules=c.modules||[];
  const navOrder=c.navOrder?.length ? c.navOrder : modules.map(m=>m.id);
  const navModules=useMemo(()=>navOrder.map(id=>modules.find(m=>m.id===id)).filter(Boolean) as GiteModuleConfig[],[navOrder,modules]);
  const update=(patch:Partial<GiteSiteConfig>)=>onChange({...c,...patch});
  const updateModule=(id:string, patch:Partial<GiteModuleConfig>)=>update({modules:modules.map(m=>m.id===id?{...m,...patch}:m)});
  const addModule=()=>{
    const id=makeId();
    const label=`Bloc ${modules.length+1}`;
    const m:GiteModuleConfig={id,label,visible:true,width:100,height:520};
    update({modules:[...modules,m],navOrder:[...(c.navOrder||modules.map(x=>x.id)),id],navLabels:{...(c.navLabels||{}),[id]:label}});
  };
  const removeModule=(id:string)=>{
    if(modules.length<=1){ alert('Le Gîte doit conserver au moins un bloc.'); return; }
    update({
      modules:modules.filter(m=>m.id!==id),
      navOrder:(c.navOrder||modules.map(m=>m.id)).filter(x=>x!==id),
      navLabels:Object.fromEntries(Object.entries(c.navLabels||{}).filter(([k])=>k!==id)),
      contentBlocks:(c.contentBlocks||[]).filter(b=>b.moduleId!==id),
    });
  };
  const moveModule=(index:number,direction:-1|1)=>{
    const next=index+direction; if(next<0||next>=modules.length)return;
    const list=[...modules]; [list[index],list[next]]=[list[next],list[index]];
    update({modules:list,navOrder:list.map(m=>m.id)});
  };
  const moveNav=(id:string,direction:-1|1)=>{
    const list=[...navOrder]; const index=list.indexOf(id); const next=index+direction; if(index<0||next<0||next>=list.length)return;
    [list[index],list[next]]=[list[next],list[index]];
    const moduleById=new Map(modules.map(m=>[m.id,m]));
    const reordered=list.map(moduleId=>moduleById.get(moduleId)).filter(Boolean) as GiteModuleConfig[];
    update({navOrder:list,modules:reordered});
  };
  const upload=async(id:string,file:File,type:'image'|'video')=>{
    setUploading(id); try{
      const prepared=type==='image'?await prepareImageForUpload(file):file;
      if(type==='video' && file.size>100*1024*1024) throw new Error('Vidéo trop lourde : 100 Mo maximum.');
      const form=new FormData(); form.append('file',prepared);
      const r=await fetch('/api/site-media',{method:'POST',credentials:'include',body:form});
      const d=await r.json().catch(()=>null); if(!r.ok||!d?.url) throw new Error(d?.error||`Upload : HTTP ${r.status}`);
      const current=modules.find(m=>m.id===id)?.background;
      updateModule(id,{background:{type,url:String(d.url),overlay:current?.overlay??0}});
    }catch(e){alert(e instanceof Error?e.message:'Upload impossible.')}finally{setUploading(null)}
  };

  return <div className="space-y-6">
    <div className={panel}>
      <div><h4 className="font-serif text-lg text-[#f3ece0]">Page Gîte — canevas libre</h4><p className="text-xs text-[#a3b1a5]">La page démarre volontairement blanche. Crée tes textes, images, vidéos et boutons depuis l’éditeur des zones libres.</p></div>
      <div className="rounded-xl border border-[#536258] bg-[#101510] p-4 text-xs text-[#a3b1a5]">Aucun contenu texte, galerie ou vidéo principal n’est imposé par le Gîte. Les éléments sont créés librement dans les blocs.</div>
    </div>

    <div className={panel}>
      <div className="flex items-center justify-between gap-3"><div><h4 className="font-serif text-lg text-[#f3ece0]">Blocs de la page</h4><p className="text-xs text-[#a3b1a5]">Ajoute, supprime, monte/descends et règle la largeur/hauteur de chaque bloc.</p></div><button type="button" onClick={addModule} className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-semibold text-[#111612]"><Plus size={15}/> Ajouter un bloc</button></div>
      <div className="space-y-3">
        {modules.map((m,idx)=><div key={m.id} className="rounded-xl border border-[#344237] bg-[#101510] p-4 space-y-3">
          <div className="flex items-center gap-2"><input value={m.label} onChange={e=>{const label=e.target.value;updateModule(m.id,{label});update({navLabels:{...(c.navLabels||{}),[m.id]:label}})}} className="flex-1 rounded-lg bg-[#18201a] border border-[#344237] px-3 py-2 text-sm font-semibold text-white"/><button type="button" disabled={idx===0} onClick={()=>moveModule(idx,-1)} className="rounded-lg bg-[#263128] p-2 text-white disabled:opacity-25"><ArrowUp size={15}/></button><button type="button" disabled={idx===modules.length-1} onClick={()=>moveModule(idx,1)} className="rounded-lg bg-[#263128] p-2 text-white disabled:opacity-25"><ArrowDown size={15}/></button><button type="button" onClick={()=>removeModule(m.id)} className="rounded-lg border border-red-900/70 bg-red-950/30 p-2 text-red-300"><Trash2 size={15}/></button></div>
          <div className="grid md:grid-cols-3 gap-3">
            <label className="text-[11px] text-[#a3b1a5]">Visible<select value={m.visible?'yes':'no'} onChange={e=>updateModule(m.id,{visible:e.target.value==='yes'})} className="mt-1 w-full rounded-lg bg-[#18201a] border border-[#344237] px-2 py-2 text-white"><option value="yes">Oui</option><option value="no">Non</option></select></label>
            <label className="text-[11px] text-[#a3b1a5]">Largeur {m.width??100}%<input type="range" min="50" max="100" value={m.width??100} onChange={e=>updateModule(m.id,{width:Number(e.target.value)})} className="mt-2 w-full accent-[#d4af37]"/></label>
            <label className="text-[11px] text-[#a3b1a5]">Hauteur {m.height??520}px<input type="range" min="180" max="1800" step="10" value={m.height??520} onChange={e=>updateModule(m.id,{height:Number(e.target.value)})} className="mt-2 w-full accent-[#d4af37]"/></label>
          </div>
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <label className="text-[11px] text-[#a3b1a5]">Fond<select value={m.background?.type||'none'} onChange={e=>e.target.value==='none'?updateModule(m.id,{background:undefined}):updateModule(m.id,{background:{type:e.target.value as any,url:m.background?.url||'',overlay:m.background?.overlay??0}})} className="mt-1 w-full rounded-lg bg-[#18201a] border border-[#344237] px-2 py-2 text-white"><option value="none">Blanc / aucun</option><option value="image">Image</option><option value="video">Vidéo</option></select></label>
            {m.background && <label className="text-[11px] text-[#a3b1a5]">Opacité du voile {m.background.overlay??0}%<input type="range" min="0" max="100" value={m.background.overlay??0} onChange={e=>updateModule(m.id,{background:{...m.background!,overlay:Number(e.target.value)}})} className="mt-2 w-full accent-[#d4af37]"/></label>}
            {m.background && <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#536258] bg-[#18201a] px-3 py-2 text-xs text-white"><Upload size={14}/>{uploading===m.id?'Upload…':'Importer un fond'}<input type="file" accept={m.background.type==='video'?'.mp4,.webm,video/mp4,video/webm':'image/*'} className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(m.id,f,m.background!.type as any)}}/></label>}
          </div>
          {m.background && <input value={m.background.url} onChange={e=>updateModule(m.id,{background:{...m.background!,url:e.target.value}})} placeholder="URL du fond (facultatif)" className="w-full rounded-lg bg-[#18201a] border border-[#344237] px-3 py-2 text-xs text-white"/>}
        </div>)}
      </div>
    </div>

    <div className={panel}>
      <div><h4 className="font-serif text-lg text-[#f3ece0]">Navigation Gîte</h4><p className="text-xs text-[#a3b1a5]">La navigation reprend les blocs présents. Tu peux renommer et déplacer les entrées gauche/droite.</p></div>
      <div className="space-y-2">{navModules.map((m,idx)=><div key={m.id} className="flex items-center gap-2 rounded-lg bg-[#101510] p-2"><span className="flex-1 text-sm text-white">{c.navLabels?.[m.id]||m.label}</span><button type="button" disabled={idx===0} onClick={()=>moveNav(m.id,-1)} className="rounded-lg bg-[#263128] p-2 text-white disabled:opacity-25"><ArrowUp size={14}/></button><button type="button" disabled={idx===navModules.length-1} onClick={()=>moveNav(m.id,1)} className="rounded-lg bg-[#263128] p-2 text-white disabled:opacity-25"><ArrowDown size={14}/></button></div>)}</div>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="text-xs text-[#a3b1a5]">Couleur de la nav<input type="color" value={c.navBackgroundColor||'#ffffff'} onChange={e=>update({navBackgroundColor:e.target.value})} className="mt-2 h-10 w-full rounded-lg bg-[#101510] border border-[#344237]"/></label>
        <label className="text-xs text-[#a3b1a5]">Opacité de la nav {c.navOpacity??94}%<input type="range" min="0" max="100" value={c.navOpacity??94} onChange={e=>update({navOpacity:Number(e.target.value)})} className="mt-2 w-full accent-[#d4af37]"/></label>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="text-xs text-[#a3b1a5]">Texte du bouton admin<input value={c.navAdminLabel||'⌂'} onChange={e=>update({navAdminLabel:e.target.value})} className="mt-2 w-full rounded-lg bg-[#101510] border border-[#344237] px-3 py-2 text-white"/></label>
        <label className="text-xs text-[#a3b1a5] flex items-center gap-2 pt-6"><input type="checkbox" checked={!!c.navCta?.visible} onChange={e=>update({navCta:{...(c.navCta||{label:'Réserver',link:''}),visible:e.target.checked}})}/> Afficher un bouton</label>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="text-xs text-[#a3b1a5]">Texte du bouton<input value={c.navCta?.label||'Réserver'} onChange={e=>update({navCta:{...(c.navCta||{label:'Réserver',link:'',visible:true}),label:e.target.value}})} className="mt-2 w-full rounded-lg bg-[#101510] border border-[#344237] px-3 py-2 text-white"/></label>
        <label className="text-xs text-[#a3b1a5]">Lien du bouton<input value={c.navCta?.link||''} onChange={e=>update({navCta:{...(c.navCta||{label:'Réserver',visible:true}),link:e.target.value}})} placeholder="https://..." className="mt-2 w-full rounded-lg bg-[#101510] border border-[#344237] px-3 py-2 text-white"/></label>
      </div>
    </div>
  </div>;
};
