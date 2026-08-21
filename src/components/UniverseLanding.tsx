import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { BrandConfig } from '../types';
import { LogoBlock } from './LogoBlock';

interface UniverseLandingProps {
  brandData: BrandConfig;
  onOpenBoutique: () => void;
  onOpenGite: () => void;
}

const mediaUrl = (value?: string) => (value && value.trim() ? value : '');

export const UniverseLanding: React.FC<UniverseLandingProps> = ({ brandData, onOpenBoutique, onOpenGite }) => {
  const [hovered, setHovered] = useState<'boutique' | 'gite' | null>(null);
  const theme = brandData.theme || {};

  const boutiqueBackground = useMemo(() => {
    return mediaUrl(theme.sectionBackgroundMedia?.hero?.url)
      || mediaUrl(theme.sectionBackgroundImages?.hero)
      || mediaUrl(brandData.heroBgImage)
      || mediaUrl(brandData.jackets?.[0]?.heroImage);
  }, [theme.sectionBackgroundMedia, theme.sectionBackgroundImages, brandData.heroBgImage, brandData.jackets]);

  const giteBackground = useMemo(() => {
    const activeModule = (brandData.gite?.modules || []).find((module) => module.visible && module.background?.url);
    return mediaUrl(activeModule?.background?.url)
      || mediaUrl(brandData.jackets?.[0]?.gallery?.[3])
      || mediaUrl(brandData.jackets?.[0]?.heroImage);
  }, [brandData.gite?.modules, brandData.jackets]);

  const sideClass = (side: 'boutique' | 'gite') => {
    if (!hovered) return 'w-1/2';
    return hovered === side ? 'w-[68%]' : 'w-[32%]';
  };

  return (
    <main className="universe-landing" aria-label="Choix de l'univers">
      <section
        className={`universe-side universe-side-boutique ${sideClass('boutique')}`}
        onMouseEnter={() => setHovered('boutique')}
        onMouseLeave={() => setHovered(null)}
        onClick={onOpenBoutique}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpenBoutique(); }}
      >
        <div className="universe-side-bg" style={{ backgroundImage: boutiqueBackground ? `url(${JSON.stringify(boutiqueBackground)})` : undefined }} />
        <div className="universe-side-overlay" />
        <div className="universe-side-content">
          <p className="universe-kicker">MAISON MAILHAGUT</p>
          <h1>La Boutique</h1>
          <LogoBlock brandData={brandData} kind="boutique" compact className="universe-logo" />
          <span className="universe-enter">Entrer <ArrowRight size={18} /></span>
        </div>
      </section>

      <section
        className={`universe-side universe-side-gite ${sideClass('gite')}`}
        onMouseEnter={() => setHovered('gite')}
        onMouseLeave={() => setHovered(null)}
        onClick={onOpenGite}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpenGite(); }}
      >
        <div className="universe-side-bg" style={{ backgroundImage: giteBackground ? `url(${JSON.stringify(giteBackground)})` : undefined }} />
        <div className="universe-side-overlay" />
        <div className="universe-side-content">
          <p className="universe-kicker">PYRÉNÉES</p>
          <h1>Le Gîte</h1>
          <LogoBlock brandData={brandData} kind="gite" compact className="universe-logo" />
          <span className="universe-enter">Entrer <ArrowRight size={18} /></span>
        </div>
      </section>
    </main>
  );
};

export default UniverseLanding;
