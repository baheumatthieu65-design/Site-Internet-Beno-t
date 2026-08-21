import React from 'react';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { BrandConfig, GiteSiteConfig } from '../types';
import { LogoBlock } from './LogoBlock';

export const GiteNavigation: React.FC<{
  brandData: BrandConfig;
  config: GiteSiteConfig;
  onBackToVitrine: () => void;
  onAdmin: () => void;
}> = ({ brandData, config, onBackToVitrine, onAdmin }) => {
  const visibleModules = (config.modules || []).filter((m) => m.visible);
  const order = config.navOrder?.length ? config.navOrder : visibleModules.map((m) => m.id);
  const ordered = order
    .map((id) => visibleModules.find((m) => m.id === id))
    .filter(Boolean) as typeof visibleModules;
  const extras = visibleModules.filter((m) => !order.includes(m.id));
  const links = [...ordered, ...extras];

  return <nav className="gite-navigation">
    <div className="gite-navigation-logos">
      <LogoBlock brandData={brandData} kind="boutique" compact onClick={onBackToVitrine} />
      <span className="gite-navigation-slash">/</span>
      <LogoBlock brandData={brandData} kind="gite" compact />
    </div>
    <div className="gite-nav-links">
      {links.map((module) => <button key={module.id} onClick={() => document.getElementById(module.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{config.navLabels?.[module.id] || module.label}</button>)}
      {config.navCta?.visible && config.navCta.link && <a className="gite-nav-cta" href={config.navCta.link} target="_blank" rel="noopener noreferrer">{config.navCta.label || 'Réserver'}</a>}
      <button className="gite-nav-admin" onClick={onAdmin} aria-label="Administration" title="Administration">{config.navAdminLabel && config.navAdminLabel !== '⌂' ? config.navAdminLabel : <Settings2 size={15}/>}</button>
    </div>
  </nav>;
};
export default GiteNavigation;
