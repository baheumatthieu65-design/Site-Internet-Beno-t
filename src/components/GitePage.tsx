import React from "react";
import { defaultGiteConfig } from "../data/giteConfig";
import { GiteNavigation } from "./GiteNavigation";
import { BrandConfig, GiteSiteConfig } from "../types";
import { FloatingMediaLayer } from "./FloatingMediaLayer";
import { GiteContentBlocks } from "./GiteContentBlocks";
import type { GiteContentBlock } from '../types';
import type { FloatingMediaItem } from "../data/floatingMedia";

const mediaStyle = (background?: GiteSiteConfig["modules"][number]["background"]): React.CSSProperties => ({
  backgroundImage: background?.type === 'image' && background.url ? `linear-gradient(rgba(20,18,15,${Math.max(0, Math.min(1,(background.overlay ?? 0)/100))}), rgba(20,18,15,${Math.max(0, Math.min(1,(background.overlay ?? 0)/100))})), url(${JSON.stringify(background.url)})` : undefined,
  backgroundSize: 'cover', backgroundPosition: 'center',
});

const ModuleBackground:React.FC<{background?:GiteSiteConfig['modules'][number]['background']}>=({background})=>background?.type==='video'&&background.url?<video className="gite-module-video" autoPlay muted loop playsInline><source src={background.url}/></video>:null;

export const GitePage:React.FC<{brandData:BrandConfig;onBackToVitrine:()=>void;onAdmin:()=>void;floatingImages?:FloatingMediaItem[];editable?:boolean;onContentBlocksChange?:(blocks:GiteContentBlock[])=>void}>=({brandData,onBackToVitrine,onAdmin,floatingImages=[],editable=false,onContentBlocksChange})=>{
  const c = brandData.gite || defaultGiteConfig;
  const module = (id:string)=>c.modules?.find(m=>m.id===id);
  const visible=(id:string)=>module(id)?.visible!==false;
  const nav={...defaultGiteConfig.navLabels,...c.navLabels};
  return <main className="gite-page">
    <GiteNavigation brandData={brandData} onBackToVitrine={onBackToVitrine} onAdmin={onAdmin} labels={nav}/>
    {visible('gite-hero') && <section id="gite-hero" className="gite-hero" style={mediaStyle(module('gite-hero')?.background)}><ModuleBackground background={module('gite-hero')?.background}/><FloatingMediaLayer sectionId="gite-hero" items={floatingImages}/><GiteContentBlocks moduleId="gite-hero" blocks={c.contentBlocks} editable={editable} onChange={onContentBlocksChange}/><img src={c.heroImage} alt={c.name}/><div className="gite-hero-overlay"><p>{c.location}</p><h1>{c.name}</h1><p>{c.tagline}</p></div></section>}
    {visible('gite-experience') && <section id="gite-experience" className="gite-section gite-section-media" style={{position:"relative",...mediaStyle(module('gite-experience')?.background)}}><ModuleBackground background={module('gite-experience')?.background}/><FloatingMediaLayer sectionId="gite-experience" items={floatingImages}/><GiteContentBlocks moduleId="gite-experience" blocks={c.contentBlocks} editable={editable} onChange={onContentBlocksChange}/><p className="gite-eyebrow">L'expérience</p><h2>{c.intro.title}</h2><p>{c.intro.text}</p></section>}
    {visible('gite-gallery') && <section id="gite-gallery" className="gite-section gite-section-media" style={{position:"relative",...mediaStyle(module('gite-gallery')?.background)}}><ModuleBackground background={module('gite-gallery')?.background}/><FloatingMediaLayer sectionId="gite-gallery" items={floatingImages}/><GiteContentBlocks moduleId="gite-gallery" blocks={c.contentBlocks} editable={editable} onChange={onContentBlocksChange}/><p className="gite-eyebrow">Le gîte en images</p><div className="gite-gallery">{c.gallery.map(i=><img key={i.src} src={i.src} alt={i.alt}/>)}</div></section>}
    {visible('gite-video') && c.videoUrl && <section id="gite-video" className="gite-video" style={{position:"relative",...mediaStyle(module('gite-video')?.background)}}><ModuleBackground background={module('gite-video')?.background}/><FloatingMediaLayer sectionId="gite-video" items={floatingImages}/><GiteContentBlocks moduleId="gite-video" blocks={c.contentBlocks} editable={editable} onChange={onContentBlocksChange}/><video controls playsInline poster={c.videoPoster||undefined}><source src={c.videoUrl}/></video></section>}
    {visible('gite-essentials') && <section id="gite-essentials" className="gite-section gite-section-media" style={{position:"relative",...mediaStyle(module('gite-essentials')?.background)}}><ModuleBackground background={module('gite-essentials')?.background}/><FloatingMediaLayer sectionId="gite-essentials" items={floatingImages}/><GiteContentBlocks moduleId="gite-essentials" blocks={c.contentBlocks} editable={editable} onChange={onContentBlocksChange}/><p className="gite-eyebrow">Les essentiels</p><div className="gite-essentials">{c.essentials.map(i=><div className="gite-card" key={i.label}><strong>{i.value}</strong><span>{i.label}</span></div>)}</div></section>}
    {visible('gite-nearby') && <section id="gite-nearby" className="gite-section gite-section-media" style={{position:"relative",...mediaStyle(module('gite-nearby')?.background)}}><ModuleBackground background={module('gite-nearby')?.background}/><FloatingMediaLayer sectionId="gite-nearby" items={floatingImages}/><GiteContentBlocks moduleId="gite-nearby" blocks={c.contentBlocks} editable={editable} onChange={onContentBlocksChange}/><p className="gite-eyebrow">Aux alentours</p><div className="gite-nearby">{c.nearby.map(i=><article key={i.title}><h3>{i.title}</h3><p>{i.text}</p></article>)}</div></section>}
    {visible('gite-stay') && <section id="gite-stay" className="gite-section gite-stay" style={{position:"relative",...mediaStyle(module('gite-stay')?.background)}}><ModuleBackground background={module('gite-stay')?.background}/><FloatingMediaLayer sectionId="gite-stay" items={floatingImages}/><GiteContentBlocks moduleId="gite-stay" blocks={c.contentBlocks} editable={editable} onChange={onContentBlocksChange}/><p className="gite-eyebrow">Séjourner</p><h2>Consulter les disponibilités</h2><p>{c.bookingText}</p><div className="gite-booking-links"><a href={c.airbnbUrl}>Airbnb</a><a href={c.bookingUrl}>Booking.com</a></div></section>}
    {visible('gite-access') && <section id="gite-access" className="gite-section gite-section-media" style={{position:"relative",...mediaStyle(module('gite-access')?.background)}}><ModuleBackground background={module('gite-access')?.background}/><FloatingMediaLayer sectionId="gite-access" items={floatingImages}/><GiteContentBlocks moduleId="gite-access" blocks={c.contentBlocks} editable={editable} onChange={onContentBlocksChange}/><p className="gite-eyebrow">Accès</p><h2>{c.access.title}</h2><p>{c.access.text}</p></section>}
  </main>
};
export default GitePage;
