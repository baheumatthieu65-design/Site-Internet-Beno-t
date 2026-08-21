import React, { useEffect, useMemo, useRef } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { defaultGiteConfig } from "../data/giteConfig";
import { GiteNavigation } from "./GiteNavigation";
import { BrandConfig, GiteContentBlock, GiteModuleConfig, GiteSiteConfig } from "../types";
import { FloatingMediaLayer } from "./FloatingMediaLayer";
import { GiteContentBlocks } from "./GiteContentBlocks";
import type { FloatingMediaItem } from "../data/floatingMedia";

const mediaStyle = (background?: GiteSiteConfig["modules"][number]["background"]): React.CSSProperties => ({
  backgroundImage: background?.type === 'image' && background.url ? `linear-gradient(rgba(20,18,15,${Math.max(0, Math.min(1,(background.overlay ?? 0)/100))}), rgba(20,18,15,${Math.max(0, Math.min(1,(background.overlay ?? 0)/100))})), url(${JSON.stringify(background.url)})` : undefined,
  backgroundSize: 'cover', backgroundPosition: 'center',
});

const ModuleBackground:React.FC<{background?:GiteSiteConfig['modules'][number]['background']}>=({background})=>background?.type==='video'&&background.url?<video className="gite-module-video" autoPlay muted loop playsInline><source src={background.url}/></video>:null;

const legacyTextBlocks = (c: GiteSiteConfig): GiteContentBlock[] => {
  const base = (id: string, moduleId: string, type: GiteContentBlock['type'], text: string, x: number, y: number, width: number, fontSize: number, extra: Partial<GiteContentBlock> = {}): GiteContentBlock => ({
    id: `legacy-${id}`, moduleId, type, text, x, y, width, height: extra.height ?? 14, fontSize, color: extra.color ?? '#24231f', align: extra.align ?? 'left', fontFamily: extra.fontFamily ?? (type === 'heading' ? 'display' : 'sans'), fontWeight: extra.fontWeight ?? (type === 'heading' ? 500 : 400), lineHeight: 1.35, italic: false, backgroundColor: extra.backgroundColor ?? 'transparent', borderWidth: 0, borderRadius: 0, padding: 0, opacity: 100, rotation: 0, objectFit: 'cover', visible: true, ...extra,
  });
  const out: GiteContentBlock[] = [
    base('hero-location','gite-hero','text',c.location,50,76,45,14,{color:'#efe7d8',align:'left',backgroundColor:'transparent'}),
    base('hero-name','gite-hero','heading',c.name,50,84,82,72,{color:'#fff',align:'left',height:28,backgroundColor:'transparent'}),
    base('hero-tagline','gite-hero','text',c.tagline,50,94,60,18,{color:'#fff',align:'left',height:12,backgroundColor:'transparent'}),
    base('experience-eyebrow','gite-experience','text',"L'expérience",50,16,90,12,{align:'center',color:'#8c6e3f',height:8}),
    base('experience-title','gite-experience','heading',c.intro.title,50,30,90,52,{align:'center',height:16}),
    base('experience-text','gite-experience','text',c.intro.text,50,48,82,18,{align:'center',height:24}),
    base('gallery-eyebrow','gite-gallery','text','Le gîte en images',50,10,90,12,{align:'center',color:'#8c6e3f',height:8}),
    base('essentials-eyebrow','gite-essentials','text','Les essentiels',50,10,90,12,{align:'center',color:'#8c6e3f',height:8}),
    base('nearby-eyebrow','gite-nearby','text','Aux alentours',50,10,90,12,{align:'center',color:'#8c6e3f',height:8}),
    base('stay-eyebrow','gite-stay','text','Séjourner',50,10,90,12,{align:'center',color:'#8c6e3f',height:8}),
    base('stay-title','gite-stay','heading','Consulter les disponibilités',50,25,90,50,{align:'center',height:16}),
    base('stay-text','gite-stay','text',c.bookingText,50,42,80,18,{align:'center',height:18}),
    { ...base('airbnb','gite-stay','button','Airbnb',37,62,24,16,{align:'center',height:10,backgroundColor:'#24231f',color:'#fff',borderColor:'#8c6e3f',borderWidth:1,padding:12}), link:c.airbnbUrl },
    { ...base('booking','gite-stay','button','Booking.com',63,62,24,16,{align:'center',height:10,backgroundColor:'#24231f',color:'#fff',borderColor:'#8c6e3f',borderWidth:1,padding:12}), link:c.bookingUrl },
    base('access-eyebrow','gite-access','text','Accès',50,12,90,12,{align:'center',color:'#8c6e3f',height:8}),
    base('access-title','gite-access','heading',c.access.title,50,28,90,48,{align:'center',height:16}),
    base('access-text','gite-access','text',c.access.text,50,46,82,18,{align:'center',height:22}),
  ];
  c.essentials.forEach((item, i) => {
    const x = 12.5 + i * 25;
    out.push(base(`essential-value-${i}`,'gite-essentials','heading',item.value,x,47,20,34,{align:'center',height:10,backgroundColor:'transparent'}));
    out.push(base(`essential-label-${i}`,'gite-essentials','text',item.label,x,56,20,11,{align:'center',height:8,color:'#5e625d',fontWeight:600}));
  });
  c.nearby.forEach((item, i) => {
    const x = 16 + i * 34;
    out.push(base(`nearby-title-${i}`,'gite-nearby','heading',item.title,x,34,28,26,{align:'left',height:12,backgroundColor:'transparent'}));
    out.push(base(`nearby-text-${i}`,'gite-nearby','text',item.text,x,49,28,15,{align:'left',height:22,backgroundColor:'transparent'}));
  });
  return out;
};

export const GitePage:React.FC<{
  brandData:BrandConfig;
  onBackToVitrine:()=>void;
  onAdmin:()=>void;
  floatingImages?:FloatingMediaItem[];
  editable?:boolean;
  onGiteChange?:(config:GiteSiteConfig)=>void;
}>=({brandData,onBackToVitrine,onAdmin,floatingImages=[],editable=false,onGiteChange})=>{
  const c = brandData.gite || defaultGiteConfig;
  const migratedRef = useRef(false);
  const contentBlocks = useMemo(() => c.contentBlocks || [], [c.contentBlocks]);

  useEffect(() => {
    if (!editable || !onGiteChange || migratedRef.current) return;
    const existing = contentBlocks;
    const existingIds = new Set(existing.map((b) => b.id));
    const missing = legacyTextBlocks(c).filter((b) => !existingIds.has(b.id));
    if (!missing.length) { migratedRef.current = true; return; }
    migratedRef.current = true;
    onGiteChange({ ...c, contentBlocks: [...existing, ...missing] });
  }, [editable, onGiteChange, c, contentBlocks]);

  const blocks = contentBlocks.length ? contentBlocks : legacyTextBlocks(c);
  const updateBlocks = (next:GiteContentBlock[]) => onGiteChange?.({ ...c, contentBlocks: next });
  const visible = (id:string) => c.modules?.find(m=>m.id===id)?.visible !== false;

  const moveModule = (id:string, direction:-1|1) => {
    if (!onGiteChange) return;
    const modules = [...c.modules];
    const index = modules.findIndex(m=>m.id===id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= modules.length) return;
    [modules[index], modules[nextIndex]] = [modules[nextIndex], modules[index]];
    onGiteChange({...c, modules});
  };

  const renderEditorControls = (module:GiteModuleConfig, index:number) => editable ? (
    <div className="absolute right-4 top-4 z-[85] flex items-center gap-1 rounded-xl border border-[#d4af37]/70 bg-[#101510]/90 p-1.5 shadow-xl backdrop-blur" data-vce-ignore="true">
      <span className="px-2 text-[10px] uppercase tracking-[.12em] text-[#d4af37]">{module.label}</span>
      <button type="button" disabled={index===0} onClick={()=>moveModule(module.id,-1)} className="rounded-lg p-2 text-[#f4ead9] hover:bg-[#29332b] disabled:opacity-25" title="Monter le bloc"><ArrowUp size={15}/></button>
      <button type="button" disabled={index===c.modules.length-1} onClick={()=>moveModule(module.id,1)} className="rounded-lg p-2 text-[#f4ead9] hover:bg-[#29332b] disabled:opacity-25" title="Descendre le bloc"><ArrowDown size={15}/></button>
    </div>
  ) : null;

  const renderBlocks = (moduleId: string) => <GiteContentBlocks moduleId={moduleId} blocks={blocks} editable={editable} onChange={updateBlocks}/>;

  const renderModule = (module:GiteModuleConfig, index:number) => {
    if (!module.visible) return null;
    const common = (children:React.ReactNode, className:string) => <section id={module.id} className={`${className} relative`} style={mediaStyle(module.background)}>{<ModuleBackground background={module.background}/>}<FloatingMediaLayer sectionId={module.id} items={floatingImages}/>{renderEditorControls(module,index)}{renderBlocks(module.id)}{children}</section>;
    switch(module.id) {
      case 'gite-hero':
        return <section id="gite-hero" className="gite-hero relative" style={mediaStyle(module.background)}><ModuleBackground background={module.background}/><FloatingMediaLayer sectionId="gite-hero" items={floatingImages}/>{renderEditorControls(module,index)}{renderBlocks('gite-hero')}<img src={c.heroImage} alt={c.name}/></section>;
      case 'gite-experience':
        return common(null,'gite-section gite-section-media');
      case 'gite-gallery':
        return common(<div className="gite-gallery">{c.gallery.map(i=><img key={i.src} src={i.src} alt={i.alt}/>)}</div>,'gite-section gite-section-media');
      case 'gite-video':
        return common(c.videoUrl ? <video controls playsInline poster={c.videoPoster||undefined}><source src={c.videoUrl}/></video> : null,'gite-video');
      case 'gite-essentials':
        return common(<div className="gite-essentials">{c.essentials.map((_,i)=><div className="gite-card" key={i} aria-hidden="true" />)}</div>,'gite-section gite-section-media');
      case 'gite-nearby':
        return common(<div className="gite-nearby">{c.nearby.map((_,i)=><article key={i} aria-hidden="true" />)}</div>,'gite-section gite-section-media');
      case 'gite-stay':
        return common(null,'gite-section gite-stay');
      case 'gite-access':
        return common(null,'gite-section gite-section-media');
      default:
        return null;
    }
  };

  const orderedModules = c.modules?.length ? c.modules : defaultGiteConfig.modules;
  const nav={...defaultGiteConfig.navLabels,...c.navLabels};

  return <main className="gite-page">
    <GiteNavigation brandData={brandData} onBackToVitrine={onBackToVitrine} onAdmin={onAdmin} labels={nav}/>
    {orderedModules.map((module,index)=>renderModule(module,index))}
  </main>;
};
export default GitePage;
