import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Save, Settings2, Type, Upload, X } from 'lucide-react';
import type { BrandConfig, SectionId } from '../types';

export type AdminBarPosition = 'top'|'bottom'|'left'|'right';
export type EditableKind = 'text'|'media';

export interface EditorBlock {
  id:string;
  type:'text'|'heading'|'button'|'image'|'video'|'spacer';
  section:SectionId;
  x:number;
  y:number;
  text?:string;
  url?:string;
  visible:boolean;
  selector?:string;
  kind?:EditableKind;
  fontFamily?:string;
  fontSize?:string;
  color?:string;
  link?:string;
}

export interface SiteEditorConfig {
  adminBarPosition:AdminBarPosition;
  heroBackground?: {
    type:'image'|'gif'|'video';
    url:string;
    poster?:string;
    overlay?:number;
    positionX?:number;
    positionY?:number;
  };
  blocks:EditorBlock[];
}

interface Props {
  brandData:BrandConfig;
  config:SiteEditorConfig;
  onChange:(config:SiteEditorConfig)=>void;
  onSave:(config?:SiteEditorConfig)=>Promise<void>|void;
}

const fonts = [
 ['Playfair Display','"Playfair Display", serif'],
 ['Cormorant Garamond','"Cormorant Garamond", serif'],
 ['Bodoni Moda','"Bodoni Moda", serif'],
 ['Cinzel','"Cinzel", serif'],
 ['Libre Baskerville','"Libre Baskerville", serif'],
 ['DM Serif Display','"DM Serif Display", serif'],
 ['EB Garamond','"EB Garamond", serif'],
 ['Lora','"Lora", serif'],
 ['Montserrat','"Montserrat", sans-serif'],
 ['Inter','"Inter", sans-serif'],
 ['Great Vibes','"Great Vibes", cursive'],
 ['Allura','"Allura", cursive'],
 ['Alex Brush','"Alex Brush", cursive'],
 ['Ballet','"Ballet", cursive'],
 ['Berkshire Swash','"Berkshire Swash", cursive'],
 ['Bonheur Royale','"Bonheur Royale", cursive'],
 ['Clicker Script','"Clicker Script", cursive'],
 ['Dancing Script','"Dancing Script", cursive'],
 ['Italianno','"Italianno", cursive'],
 ['Lovers Quarrel','"Lovers Quarrel", cursive'],
 ['Mrs Saint Delafield','"Mrs Saint Delafield", cursive'],
 ['Parisienne','"Parisienne", cursive'],
 ['Pinyon Script','"Pinyon Script", cursive'],
 ['Sacramento','"Sacramento", cursive'],
 ['Tangerine','"Tangerine", cursive'],
 ['Qwigley','"Qwigley", cursive'],
 ['Lavishly Yours','"Lavishly Yours", cursive'],
 ['Mea Culpa','"Mea Culpa", cursive'],
 ['Ms Madi','"Ms Madi", cursive'],
 ['WindSong','"WindSong", cursive'],
 ['Water Brush','"Water Brush", cursive'],
];

const sizes = ['12px','14px','16px','18px','20px','22px','24px','28px','32px','36px','40px','48px','56px','64px','72px','80px','96px'];

const GOOGLE_FONTS = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Ballet&family=Berkshire+Swash&family=Bonheur+Royale&family=Cinzel:wght@400;500;600;700;800;900&family=Clicker+Script&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Dancing+Script:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=EB+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Great+Vibes&family=Inter:wght@400;500;600;700&family=Italianno&family=Lavishly+Yours&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Lovers+Quarrel&family=Mea+Culpa&family=Montserrat:wght@400;500;600;700&family=Mrs+Saint+Delafield&family=Ms+Madi&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=Qwigley&family=Sacramento&family=Tangerine:wght@400;700&family=Water+Brush&family+WindSong:wght@400;500&display=swap';

const cssPath=(el:Element)=>{
 const parts:string[]=[]; let n:Element|null=el;
 while(n&&n.nodeType===1&&parts.length<7){
  let s=n.tagName.toLowerCase();
  if((n as HTMLElement).id) {s+=`#${CSS.escape((n as HTMLElement).id)}`;parts.unshift(s);break;}
  const cls=Array.from(n.classList).filter(c=>!c.includes(':')&&!c.includes('[')).slice(0,2);
  if(cls.length)s+='.'+cls.map(CSS.escape).join('.');
  const parent=n.parentElement;
  if(parent){const same=Array.from(parent.children).filter(x=>x.tagName===n!.tagName); if(same.length>1)s+=`:nth-of-type(${same.indexOf(n)+1})`;}
  parts.unshift(s);n=n.parentElement;
 }
 return parts.join(' > ');
};

const isEditableText=(el:Element)=>{
 const tag=el.tagName;
 if(['H1','H2','H3','H4','H5','H6','P','SPAN','BUTTON','A','LI','BLOCKQUOTE'].includes(tag)) return true;
 return !!el.closest('[data-vce-editable="true"]');
};

const applyPosition=(p:AdminBarPosition)=>{
 const bar=document.getElementById('admin-top-bar'); if(!bar)return;
 Object.assign(bar.style,{position:'fixed',zIndex:'4000',top:'auto',bottom:'auto',left:'auto',right:'auto',width:'auto',transform:''});
 if(p==='top')Object.assign(bar.style,{top:'0',left:'0',right:'0',width:'100%'});
 if(p==='bottom')Object.assign(bar.style,{bottom:'0',left:'0',right:'0',width:'100%'});
 if(p==='left')Object.assign(bar.style,{top:'50%',left:'0',transform:'translateY(-50%)'});
 if(p==='right')Object.assign(bar.style,{top:'50%',right:'0',transform:'translateY(-50%)'});
};

export const SiteVisualEditor:React.FC<Props>=({config,onChange,onSave})=>{
 const [open,setOpen]=useState(false),[direct,setDirect]=useState(false),[selected,setSelected]=useState<{el:HTMLElement,type:'text'|'media'}|null>(null);
 const [current,setCurrent]=useState(''),[replacement,setReplacement]=useState('');
 const [font,setFont]=useState(fonts[0][1]),[size,setSize]=useState('24px'),[color,setColor]=useState('#f3ece0');
 const [saving,setSaving]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState('');
 const input=useRef<HTMLInputElement>(null);

 useEffect(()=>{applyPosition(config.adminBarPosition||'top')},[config.adminBarPosition]);
 useEffect(()=>{let l=document.querySelector('link[data-vce-fonts]');if(!l){l=document.createElement('link');l.rel='stylesheet';l.setAttribute('data-vce-fonts','true');l.setAttribute('href',GOOGLE_FONTS);document.head.appendChild(l)}},[]);

 useEffect(()=>{
  if(!open||!direct)return;
  const handler=(e:MouseEvent)=>{
   const t=e.target as HTMLElement|null;
   if(!t||t.closest('#site-visual-editor-panel')||t.closest('#admin-top-bar')||t.closest('#main-nav-header')||t.closest('[data-vce-ignore="true"]'))return;
   const media=t.closest('img,video') as HTMLElement|null;
   const text=media?null:(isEditableText(t)?t:t.closest('h1,h2,h3,h4,h5,h6,p,span,button,a,li,blockquote') as HTMLElement|null);
   if(!media&&!text)return;
   e.preventDefault();e.stopPropagation();
   const el=media||text!;
   const selector=cssPath(el);
   const saved=config.blocks.find(b=>b.selector===selector);
   setSelected({el,type:media?'media':'text'});
   if(text){
    const cs=getComputedStyle(text);
    setCurrent(text.textContent||'');setReplacement(saved?.text??text.textContent??'');
    setFont(saved?.fontFamily??cs.fontFamily);setSize(saved?.fontSize??cs.fontSize);setColor(saved?.color??rgbHex(cs.color));
   }
   setMessage(media?'Image / vidéo sélectionnée.':'Texte sélectionné.');
  };
  document.addEventListener('click',handler,true);return()=>document.removeEventListener('click',handler,true);
 },[open,direct,config.blocks]);

 const save=async()=>{
  if(!selected)return;
  setSaving(true);setError(null);setMessage('');
  try{
   const selector=cssPath(selected.el);
   let blocks=config.blocks.filter(b=>b.selector!==selector);
   if(selected.type==='text'){
    selected.el.textContent=replacement;Object.assign(selected.el.style,{fontFamily:font,fontSize:size,color});
    blocks.push({id:`text-${Date.now()}`,type:'text',section:'hero',x:50,y:50,text:replacement,visible:true,selector,kind:'text',fontFamily:font,fontSize:size,color});
   }else{
    // Image changes are handled by upload()/library chooser.
    setMessage('Choisissez une nouvelle image puis enregistrez.');
   }
   const next={...config,blocks};onChange(next);await onSave(next);setSelected(null);setMessage('Publié : les visiteurs verront cette modification.');
  }catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible.')}finally{setSaving(false)}
 };

 const upload=async(file:File)=>{
  if(!selected||selected.type!=='media')return;
  setUploading(true);setError(null);
  try{
   const fd=new FormData();fd.append('file',file);
   const r=await fetch('/api/site-media',{method:'POST',credentials:'include',body:fd});const d=await r.json();
   if(!r.ok||!d?.url)throw new Error(d?.error||`Upload HTTP ${r.status}`);
   const selector=cssPath(selected.el);const blocks=config.blocks.filter(b=>b.selector!==selector);
   const type=file.type.startsWith('video/')?'video':'image';
   blocks.push({id:`media-${Date.now()}`,type,section:'hero',x:50,y:50,url:d.url,visible:true,selector,kind:'media'});
   if(selected.el instanceof HTMLImageElement)selected.el.src=d.url;
   if(selected.el instanceof HTMLVideoElement){selected.el.src=d.url;selected.el.load()}
   const next={...config,blocks};onChange(next);await onSave(next);setSelected(null);setMessage('Média remplacé et publié.');
  }catch(e){setError(e instanceof Error?e.message:'Upload impossible.')}finally{setUploading(false)}
 };

 const changeAdmin=(p:AdminBarPosition)=>{const next={...config,adminBarPosition:p};onChange(next);applyPosition(p)};

 if(!open)return <button type="button" data-vce-ignore="true" onClick={()=>setOpen(true)} className="fixed bottom-4 right-4 z-[5000] rounded-full bg-[#d4af37] text-black p-3 shadow-2xl"><Settings2 className="w-5 h-5"/></button>;

 return <aside id="site-visual-editor-panel" data-vce-ignore="true" className="fixed bottom-4 right-4 z-[5000] w-[min(520px,calc(100vw-2rem))] max-h-[90vh] overflow-auto rounded-2xl bg-[#111711] text-white border border-[#d4af37]/70 shadow-2xl">
  <header className="sticky top-0 z-10 flex justify-between items-center p-4 bg-[#172019] border-b border-[#334236]"><div><b className="text-[#d4af37]">Éditeur visuel</b><div className="text-[10px] text-[#9aaa9d]">Un seul module pour texte, style et médias</div></div><button type="button" onClick={()=>{setOpen(false);setDirect(false);setSelected(null)}}><X/></button></header>
  <div className="p-4 space-y-3">
   <button type="button" onClick={()=>{setDirect(v=>!v);setSelected(null)}} className={`w-full rounded-lg py-3 font-bold ${direct?'bg-[#d4af37] text-black':'bg-[#263329]'}`}><Type className="inline w-4 h-4 mr-2"/>{direct?'Sélection directe ACTIVÉE':'Modifier directement sur la page'}</button>
   <div><label className="text-xs text-[#c4ceb8]">Barre administrateur</label><select value={config.adminBarPosition||'top'} onChange={e=>changeAdmin(e.target.value as AdminBarPosition)} className="w-full mt-1 rounded-lg bg-[#1c261e] border border-[#405044] p-2"><option value="top">Haut</option><option value="bottom">Bas</option><option value="left">Gauche</option><option value="right">Droite</option></select></div>
   {selected?.type==='text'&&<section className="rounded-xl border border-[#d4af37]/60 p-3 space-y-3">
    <b className="text-[#d4af37]">Modifier le texte</b>
    <div><label className="text-[10px] text-[#94a395]">Texte actuel</label><textarea readOnly value={current} className="w-full rounded bg-black/30 p-2 text-xs"/></div>
    <div><label className="text-[10px] text-[#94a395]">Texte de remplacement</label><textarea value={replacement} onChange={e=>setReplacement(e.target.value)} className="w-full rounded bg-black/40 border border-[#d4af37]/50 p-2"/></div>
    <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px]">Police</label><select value={font} onChange={e=>setFont(e.target.value)} className="w-full rounded bg-black/40 p-2 text-xs">{fonts.map(([n,v])=><option key={v} value={v}>{n}</option>)}</select></div><div><label className="text-[10px]">Taille</label><select value={size} onChange={e=>setSize(e.target.value)} className="w-full rounded bg-black/40 p-2 text-xs">{sizes.map(s=><option key={s}>{s}</option>)}</select></div></div>
    <div className="flex gap-2 items-end"><div className="flex-1"><label className="text-[10px]">Couleur</label><input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-full h-10 rounded bg-black/40"/></div><div className="flex-[2]"><input value={color} onChange={e=>setColor(e.target.value)} className="w-full h-10 rounded bg-black/40 p-2 uppercase text-xs"/></div></div>
    <div style={{fontFamily:font,fontSize:size,color}} className="rounded bg-black/30 p-3">Aperçu : {replacement}</div>
    <button type="button" disabled={saving} onClick={save} className="w-full rounded-lg bg-[#d4af37] text-black font-bold p-3 disabled:opacity-50">{saving?<><Loader2 className="inline animate-spin mr-2"/>Publication...</>:<><Save className="inline mr-2"/>Enregistrer et publier</>}</button>
   </section>}
   {selected?.type==='media'&&<section className="rounded-xl border border-[#d4af37]/60 p-3 space-y-2"><b className="text-[#d4af37]">Remplacer le média</b><input ref={input} type="file" accept="image/*,video/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)upload(f)}}/><button type="button" onClick={()=>input.current?.click()} disabled={uploading} className="w-full rounded-lg bg-[#d4af37] text-black font-bold p-3">{uploading?<><Loader2 className="inline animate-spin mr-2"/>Upload...</>:<><Upload className="inline mr-2"/>Importer et publier</>}</button></section>}
   {message&&<div className="text-xs text-emerald-300 bg-emerald-950/40 rounded p-2">{message}</div>}
   {error&&<div className="text-xs text-red-300 bg-red-950/40 rounded p-2">{error}</div>}
   <p className="text-[10px] text-[#819084]">En mode sélection directe, clique sur n'importe quel texte ou image du site. Pour une nouvelle fiche produit, ses images sont sélectionnables automatiquement dès qu'elles sont rendues par la page.</p>
  </div>
 </aside>
};

function rgbHex(rgb:string){const m=rgb.match(/\d+/g)?.map(Number);if(!m||m.length<3)return '#f3ece0';return '#'+m.slice(0,3).map(x=>x.toString(16).padStart(2,'0')).join('')}
