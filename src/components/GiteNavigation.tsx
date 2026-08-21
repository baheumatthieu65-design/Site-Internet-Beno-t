import React from 'react';
import { Settings2, LogOut, Sparkles } from 'lucide-react';
import { BrandConfig, GiteSiteConfig } from '../types';
import { LogoBlock } from './LogoBlock';
import adminSheep from '../assets/admin-sheep.png';
import { getButtonClasses } from '../utils/themeStyles';

export const GiteNavigation: React.FC<{
  brandData: BrandConfig;
  config: GiteSiteConfig;
  onBackToVitrine: () => void;
  onAdmin: () => void;
  isAdminLoggedIn?: boolean;
}> = ({ brandData, config, onBackToVitrine, onAdmin, isAdminLoggedIn = false }) => {
  const visibleModules = (config.modules || []).filter((m) => m.visible);
  const order = config.navOrder?.length ? config.navOrder : visibleModules.map((m) => m.id);
  const ordered = order.map((id) => visibleModules.find((m) => m.id === id)).filter(Boolean) as typeof visibleModules;
  const extras = visibleModules.filter((m) => !order.includes(m.id));
  const links = [...ordered, ...extras];

  const navOpacity = Math.max(0, Math.min(100, config.navOpacity ?? 94)) / 100;
  const rawNavBackground = String(config.navBackgroundColor || '#ffffff').trim().replace(/^#/, '');
  const hex = /^[0-9a-fA-F]{6}$/.test(rawNavBackground)
    ? rawNavBackground
    : /^[0-9a-fA-F]{3}$/.test(rawNavBackground)
      ? rawNavBackground.split('').map((ch) => ch + ch).join('')
      : 'ffffff';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const navBackgroundRgba = `rgba(${r},${g},${b},${navOpacity})`;
  const orderButtonClass = getButtonClasses(brandData.theme, 'primary', 'navbar-order');

  const logoPair = (
    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
      <LogoBlock brandData={brandData} kind="boutique" compact onClick={onBackToVitrine} />
      <span className="hidden sm:block h-10 w-[2px] bg-[#d4af37]/80 rotate-[15deg]" aria-hidden="true" />
      <LogoBlock brandData={brandData} kind="gite" compact />
    </div>
  );

  return (
    <nav
      className="gite-navigation"
      style={{ backgroundColor: navBackgroundRgba, backgroundImage: 'none' }}
    >
      <div className="max-w-[1450px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {logoPair}

        <div className="gite-nav-links ml-auto">
          {links.map((module) => (
            <button
              key={module.id}
              onClick={() => document.getElementById(module.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="gite-nav-link"
            >
              {config.navLabels?.[module.id] || module.label}
            </button>
          ))}

          {config.navCta?.visible && config.navCta.link && (
            <a
              className={`gite-nav-cta${config.navCta.imageUrl ? ' gite-nav-cta-image' : ''}${config.navCta.hoverEffect ? ` hover-${config.navCta.hoverEffect}` : ''} ${!config.navCta.imageUrl ? orderButtonClass : ''}`}
              href={config.navCta.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={config.navCta.label || 'Réserver'}
            >
              {config.navCta.imageUrl ? (
                <img src={config.navCta.imageUrl} alt={config.navCta.label || 'Réserver'} />
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /><span>{config.navCta.label || 'Réserver'}</span></>
              )}
            </a>
          )}

          <button
            className="gite-nav-admin"
            onClick={onAdmin}
            aria-label={isAdminLoggedIn ? 'Se déconnecter' : 'Administration'}
            title={isAdminLoggedIn ? 'Se déconnecter' : 'Administration'}
          >
            {isAdminLoggedIn ? (
              <span className="gite-nav-admin-logout">×</span>
            ) : (
              <>
                <img src={adminSheep} alt="" aria-hidden="true" className="gite-nav-admin-sheep" />
                <span className="gite-nav-admin-dot" />
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};
export default GiteNavigation;
