import React, { useEffect, useState } from 'react';
import type { EditorBlock, SiteEditorConfig } from './SiteVisualEditor';

interface Props { config: SiteEditorConfig; }

export const SiteBlocksRenderer: React.FC<Props> = ({ config }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    const update=()=>{const hero=document.getElementById('hero-section');setRect(hero?.getBoundingClientRect()??null);};
    update(); window.addEventListener('resize',update); window.addEventListener('scroll',update,{passive:true});
    const timer=window.setInterval(update,500); return()=>{window.removeEventListener('resize',update);window.removeEventListener('scroll',update);window.clearInterval(timer);};
  },[]);
  if(!rect)return null;
  const blocks=(config.blocks||[]).filter(b=>b.visible&&!b.selector&&b.section==='hero');
  return <div aria-hidden="true" className="fixed z-[25] pointer-events-none" style={{top:rect.top,left:rect.left,width:rect.width,height:rect.height}}>
    {blocks.map((block:EditorBlock)=>{
      const common:React.CSSProperties={position:'absolute',left:`${block.x}%`,top:`${block.y}%`,transform:'translate(-50%, -50%)',pointerEvents:'auto',fontFamily:block.fontFamily,fontSize:block.fontSize};
      if(block.type==='image'&&block.url)return <img key={block.id} src={block.url} alt="" className="max-w-[280px] max-h-[220px] rounded-xl object-cover shadow-2xl" style={common}/>;
      if(block.type==='video'&&block.url)return <video key={block.id} src={block.url} autoPlay muted loop playsInline className="max-w-[420px] max-h-[260px] rounded-xl object-cover shadow-2xl" style={common}/>;
      if(block.type==='button')return <a key={block.id} href={block.link||'#'} onClick={e=>e.preventDefault()} className="px-6 py-3 rounded-full bg-[#d4af37] text-black font-semibold shadow-2xl border border-[#f0d47a]" style={common}>{block.text||'Bouton'}</a>;
      if(block.type==='heading')return <div key={block.id} className="px-3 py-2 text-2xl sm:text-4xl font-serif font-semibold text-[#f5eedf] drop-shadow-xl whitespace-nowrap" style={common}>{block.text||'Nouveau titre'}</div>;
      return <div key={block.id} className="px-3 py-2 text-base text-[#f3ece0] drop-shadow-xl max-w-[420px] text-center" style={common}>{block.text||'Nouveau texte'}</div>;
    })}
  </div>;
};
