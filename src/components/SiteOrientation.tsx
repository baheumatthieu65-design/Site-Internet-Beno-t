import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { BrandConfig } from '../types';
import { getLogoConfig } from './LogoBlock';

interface SiteOrientationProps { brandData: BrandConfig; onOpenBoutique: () => void; onOpenGite: () => void; }
const mediaUrl = (value: unknown) => typeof value === 'string' ? value : '';

export const SiteOrientation: React.FC<SiteOrientationProps> = ({ brandData, onOpenBoutique, onOpenGite }) => {
  const [hovered, setHovered] = useState<'boutique' | 'gite' | null>(null);
  const theme = brandData.theme as any;
  const boutiqueLogo = getLogoConfig(brandData, 'boutique');
  const giteLogo = getLogoConfig(brandData, 'gite');
  const boutiqueBackground = mediaUrl(theme?.sectionBackgroundMedia?.hero?.url) || mediaUrl(theme?.sectionBackgroundImages?.hero) || mediaUrl((brandData as any).heroBackground?.url) || mediaUrl(brandData.heroBgImage);
  const giteBackground = mediaUrl((brandData as any).gite?.heroImage) || mediaUrl((brandData as any).gite?.modules?.[0]?.background?.url) || mediaUrl((brandData as any).gite?.modules?.[1]?.background?.url);
  const panelClass = (side: 'boutique' | 'gite') => `relative min-h-[100svh] flex-1 overflow-hidden cursor-pointer transition-[flex] duration-700 ease-out ${hovered === side ? 'flex-[1.12]' : hovered ? 'flex-[0.88]' : 'flex-1'}`;
  const imageClass = (side: 'boutique' | 'gite') => `absolute inset-0 h-full w-full object-cover transition-[filter,transform,opacity] duration-700 ease-out ${hovered === side ? 'blur-0 scale-105 opacity-100' : hovered ? 'blur-[7px] opacity-70' : 'blur-[3px] opacity-85'}`;
  const logoPanel = (kind: 'boutique' | 'gite', title: string) => { const logo = kind === 'boutique' ? boutiqueLogo : giteLogo; return <div className="mb-7 max-w-[88%] rounded-2xl border border-[#d4af37]/70 bg-black/25 px-6 py-4 backdrop-blur-sm">{logo.imageUrl && <img src={logo.imageUrl} alt={`Logo ${kind}`} className="mx-auto mb-4 max-h-24 max-w-[260px] object-contain" />}{logo.showText !== false && <div className="whitespace-pre-line text-3xl font-semibold tracking-wide md:text-5xl" style={{ color: logo.textColor }}>{logo.text}</div>}{logo.secondaryText && <div className="mt-2 text-xs uppercase tracking-[.25em] text-white/75">{logo.secondaryText}</div>}</div>; };
  return <main className="fixed inset-0 z-[80] flex flex-col md:flex-row bg-[#101410] overflow-hidden" aria-label="Choix de l'univers">
    <button type="button" onClick={onOpenBoutique} onMouseEnter={() => setHovered('boutique')} onMouseLeave={() => setHovered(null)} className={panelClass('boutique')}>
      {boutiqueBackground && <img src={boutiqueBackground} alt="Ambiance de la boutique" className={imageClass('boutique')} />}<div className="absolute inset-0 bg-black/45" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">{logoPanel('boutique','La Boutique')}<h1 className="text-5xl font-light md:text-8xl">La Boutique</h1><span className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/30 px-5 py-3 text-sm uppercase tracking-[.18em] backdrop-blur-md">Entrer <ArrowRight size={16}/></span></div>
    </button>
    <button type="button" onClick={onOpenGite} onMouseEnter={() => setHovered('gite')} onMouseLeave={() => setHovered(null)} className={panelClass('gite')}>
      {giteBackground && <img src={giteBackground} alt="Ambiance du gîte" className={imageClass('gite')} />}<div className="absolute inset-0 bg-black/35" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">{logoPanel('gite','Le Gîte')}<h1 className="text-5xl font-light md:text-8xl">Le Gîte</h1><span className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/30 px-5 py-3 text-sm uppercase tracking-[.18em] backdrop-blur-md">Découvrir <ArrowRight size={16}/></span></div>
    </button>
  </main>;
};
