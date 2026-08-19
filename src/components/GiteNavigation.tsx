import React from 'react';
import { pageConfigs, getVisiblePageNavigation } from '../data/pageConfigs';
import { BrandConfig } from '../types';
import { LogoBlock } from './LogoBlock';

export const GiteNavigation: React.FC<{
  brandData: BrandConfig;
  onBackToVitrine: () => void;
  onAdmin: () => void;
}> = ({ brandData, onBackToVitrine, onAdmin }) => {
  const items = getVisiblePageNavigation(pageConfigs.gite);
  return <nav className="gite-navigation">
    <div className="gite-navigation-logos">
      <LogoBlock brandData={brandData} kind="boutique" compact onClick={onBackToVitrine} />
      <span className="gite-navigation-slash">/</span>
      <LogoBlock brandData={brandData} kind="gite" compact />
    </div>
    <div className="gite-nav-links">
      {items.map(item => item.kind === 'home'
        ? <button key={item.id} onClick={onBackToVitrine}>← {item.label}</button>
        : <button key={item.id} onClick={() => item.targetModuleId && document.getElementById(item.targetModuleId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{item.label}</button>)}
      <button className="gite-nav-admin" onClick={onAdmin} aria-label="Administration">●</button>
    </div>
  </nav>;
};
export default GiteNavigation;
