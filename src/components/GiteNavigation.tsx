import React from 'react';
import { pageConfigs, getVisiblePageNavigation } from '../data/pageConfigs';
import { BrandConfig } from '../types';
import { LogoBlock } from './LogoBlock';

export const GiteNavigation: React.FC<{
  brandData: BrandConfig;
  onBackToVitrine: () => void;
  onAdmin: () => void;
  labels?: Record<string,string>;
}> = ({ brandData, onBackToVitrine, onAdmin, labels = {} }) => {
  const items = getVisiblePageNavigation(pageConfigs.gite);
  return <nav className="gite-navigation">
    <div className="gite-navigation-logos">
      <LogoBlock brandData={brandData} kind="boutique" compact onClick={onBackToVitrine} />
      <span className="gite-navigation-slash">/</span>
      <LogoBlock brandData={brandData} kind="gite" compact />
    </div>
    <div className="gite-nav-links">
      {items.filter(item => item.kind !== 'home').map(item => { const key = item.id.replace('gite-nav-','').replace(/^experience$/,'experience'); const label = labels[key] || item.label; return <button key={item.id} onClick={() => item.targetModuleId && document.getElementById(item.targetModuleId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{label}</button>; })}
      <button className="gite-nav-admin" onClick={onAdmin} aria-label="Administration">⌂</button>
    </div>
  </nav>;
};
export default GiteNavigation;
