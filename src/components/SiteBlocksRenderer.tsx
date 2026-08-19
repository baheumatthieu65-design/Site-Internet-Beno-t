import React, { useEffect } from 'react';
import type { EditorBlock, SiteEditorConfig } from './SiteVisualEditor';

const apply=(blocks:EditorBlock[])=>{
 for(const b of blocks||[]){
  if(!b.visible||!b.selector)continue;
  let el:Element|null=null;try{el=document.querySelector(b.selector)}catch{continue}
  if(!el)continue;
  const h=el as HTMLElement;
  if(b.kind==='text'){if(b.text!=null)h.textContent=b.text;if(b.fontFamily)h.style.fontFamily=b.fontFamily;if(b.fontSize)h.style.fontSize=b.fontSize;if(b.color)h.style.color=b.color}
  if(b.kind==='media'&&b.url){
   // React owns the product gallery. Never write `src` directly here:
   // doing so can desynchronise the main image from the thumbnails.
   if (el.hasAttribute('data-vce-reactive-gallery')) continue;
   if(el instanceof HTMLImageElement)el.src=b.url;
   if(el instanceof HTMLVideoElement){el.src=b.url;el.load()}
  }
 }
};

export const SiteBlocksRenderer:React.FC<{config:SiteEditorConfig}>=({config})=>{
 useEffect(()=>{apply(config.blocks||[])},[config.blocks]);
 return null;
};
