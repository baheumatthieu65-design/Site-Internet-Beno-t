import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { defaultGiteConfig } from "../data/giteConfig";
import { GiteNavigation } from "./GiteNavigation";
import { BrandConfig, GiteModuleConfig, GiteSiteConfig } from "../types";
import { FloatingMediaLayer } from "./FloatingMediaLayer";
import { GiteContentBlocks } from "./GiteContentBlocks";
import type { FloatingMediaItem } from "../data/floatingMedia";

const mediaStyle = (background?: GiteSiteConfig["modules"][number]["background"]): React.CSSProperties => ({
  backgroundImage: background?.type === 'image' && background.url ? `linear-gradient(rgba(20,18,15,${Math.max(0, Math.min(1,(background.overlay ?? 0)/100))}), rgba(20,18,15,${Math.max(0, Math.min(1,(background.overlay ?? 0)/100))})), url(${JSON.stringify(background.url)})` : undefined,
  backgroundSize: 'cover',
  backgroundPosition: `${background?.positionX ?? 50}% ${background?.positionY ?? 50}%`,
});

const ModuleBackground: React.FC<{background?: GiteSiteConfig['modules'][number]['background']}>=({background})=>background?.type==='video'&&background.url?<video className="gite-module-video" autoPlay muted loop playsInline><source src={background.url}/></video>:null;

const normalizeConfig = (input?: GiteSiteConfig): GiteSiteConfig => {
  const base = defaultGiteConfig;
  if (!input) return JSON.parse(JSON.stringify(base));
  const legacyIds = new Set(['gite-hero','gite-experience','gite-gallery','gite-video','gite-essentials','gite-nearby','gite-stay','gite-access']);
  const legacy = (input.modules || []).some((m) => legacyIds.has(m.id));
  if (!legacy) return input;
  return {
    ...base,
    name: input.name || base.name,
    location: input.location || base.location,
    navCta: input.navCta || base.navCta,
    navAdminLabel: input.navAdminLabel || base.navAdminLabel,
    modules: base.modules.map((m) => ({ ...m })),
    navLabels: { ...base.navLabels },
    navOrder: [...(base.navOrder || [])],
    contentBlocks: [],
  };
};

export const GitePage:React.FC<{
  brandData:BrandConfig;
  onBackToVitrine:()=>void;
  onAdmin:()=>void;
  floatingImages?:FloatingMediaItem[];
  editable?:boolean;
  onGiteChange?:(config:GiteSiteConfig)=>void;
}>=({brandData,onBackToVitrine,onAdmin,floatingImages=[],editable=false,onGiteChange})=>{
  const c = normalizeConfig(brandData.gite);
  const blocks = c.contentBlocks || [];
  const updateBlocks = (next:GiteSiteConfig['contentBlocks']) => onGiteChange?.({ ...c, contentBlocks: next });
  const moveModule = (id:string, direction:-1|1) => {
    if (!onGiteChange) return;
    const modules = [...c.modules];
    const index = modules.findIndex(m=>m.id===id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= modules.length) return;
    [modules[index], modules[nextIndex]] = [modules[nextIndex], modules[index]];
    onGiteChange({ ...c, modules, navOrder: modules.map((module) => module.id) });
  };

  const renderEditorControls = (module:GiteModuleConfig, index:number) => editable ? (
    <div className="gite-module-editor-controls" data-vce-ignore="true">
      <span>{module.label}</span>
      <button type="button" disabled={index===0} onClick={()=>moveModule(module.id,-1)} title="Monter le bloc"><ArrowUp size={14}/></button>
      <button type="button" disabled={index===c.modules.length-1} onClick={()=>moveModule(module.id,1)} title="Descendre le bloc"><ArrowDown size={14}/></button>
    </div>
  ) : null;

  const renderModule = (module:GiteModuleConfig, index:number) => {
    if (!module.visible) return null;
    const width = Math.max(50, Math.min(100, module.width ?? 100));
    const height = Math.max(180, Math.min(1800, module.height ?? 520));
    return <section id={module.id} key={module.id} className="gite-blank-module relative" style={{ ...mediaStyle(module.background), width:`${width}%`, minHeight:`${height}px` }}>
      <ModuleBackground background={module.background}/>
      <FloatingMediaLayer sectionId={module.id} items={floatingImages}/>
      {renderEditorControls(module,index)}
      <GiteContentBlocks moduleId={module.id} blocks={blocks} editable={editable} onChange={updateBlocks}/>
    </section>;
  };

  return <main className="gite-page">
    <GiteNavigation brandData={brandData} config={c} onBackToVitrine={onBackToVitrine} onAdmin={onAdmin}/>
    <div className="gite-page-canvas">{c.modules?.map((module,index)=>renderModule(module,index))}</div>
  </main>;
};
export default GitePage;
