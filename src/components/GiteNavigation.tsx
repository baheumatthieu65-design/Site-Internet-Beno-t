import React from "react";
import { pageConfigs, getVisiblePageNavigation } from "../data/pageConfigs";
export const GiteNavigation:React.FC<{onBackToVitrine:()=>void;onAdmin:()=>void}>=({onBackToVitrine,onAdmin})=>{
 const items=getVisiblePageNavigation(pageConfigs.gite);
 return <nav className="gite-navigation">
  <button className="gite-nav-brand" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>Le Gîte</button>
  <div className="gite-nav-links">
   {items.map(item=>item.kind==="home"
    ? <button key={item.id} onClick={onBackToVitrine}>← {item.label}</button>
    : <button key={item.id} onClick={()=>item.targetModuleId&&document.getElementById(item.targetModuleId)?.scrollIntoView({behavior:"smooth",block:"start"})}>{item.label}</button>)}
   <button className="gite-nav-admin" onClick={onAdmin} aria-label="Administration">●</button>
  </div>
 </nav>
};
export default GiteNavigation;
