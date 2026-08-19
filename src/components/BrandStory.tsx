import React from 'react';
import { BrandConfig } from '../types';
import { Mountain, Quote, ShieldCheck, Edit3 } from 'lucide-react';
import { getCardClasses } from '../utils/themeStyles';
import { LogoBlock } from './LogoBlock';

interface BrandStoryProps { brandData: BrandConfig; isAdminLoggedIn?: boolean; onOpenEditorSection?: (tab: 'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security') => void; }

export const BrandStory: React.FC<BrandStoryProps> = ({ brandData, isAdminLoggedIn, onOpenEditorSection }) => {
  const cardStyle = getCardClasses(brandData.theme);
  return (
    <section id="origines" className="py-24 bg-[#181e19] text-[#e2d5c3] relative overflow-hidden group/origines">
      {isAdminLoggedIn && onOpenEditorSection && <div className="absolute top-8 right-6 z-30 opacity-90 hover:opacity-100 transition-opacity"><button onClick={() => onOpenEditorSection('brand')} className="flex items-center space-x-1.5 bg-[#1b241d]/90 backdrop-blur-md border border-[#d4af37]/60 px-3 py-1.5 rounded-full shadow-2xl text-xs text-[#d4af37]"><Edit3 className="w-3 h-3" /><span>Éditer le Récit</span></button></div>}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#273229] border border-[#3e4e41] text-[#d4af37] text-xs font-serif uppercase tracking-widest"><Mountain className="w-3.5 h-3.5 text-[#d4af37]" /><span>Savoir-Faire Pyrénéen</span></div>
            {brandData.storyTitle && <h2 className="font-serif text-3xl sm:text-5xl font-light text-[#f3ece0] leading-tight">{brandData.storyTitle}</h2>}
            <div className={`relative p-6 rounded-3xl ${cardStyle.card} space-y-4`}>
              <LogoBlock brandData={brandData} kind="boutique" />
              {brandData.designerLocation && <p className="text-xs text-[#a3b1a5] uppercase tracking-wider">{brandData.designerLocation}</p>}
              {brandData.tagline && <blockquote className="text-sm italic text-[#d0c5b4] font-serif border-l-2 border-[#d4af37] pl-4 py-1">"{brandData.tagline}"</blockquote>}
            </div>
            {brandData.manifesto?.length > 0 && <div className="space-y-3 pt-2">{brandData.manifesto.map((item, idx) => <div key={idx} className="flex items-start space-x-3 text-sm text-[#b8c5ba]"><ShieldCheck className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" /><span>{item}</span></div>)}</div>}
          </div>
          <div className="lg:col-span-7 space-y-6 text-sm sm:text-base text-[#b8c5ba] leading-relaxed">
            <div className={`p-8 rounded-3xl ${cardStyle.card} space-y-6`}><Quote className="w-10 h-10 text-[#d4af37]/30" />{brandData.storyText1 && <p className="font-serif text-lg text-[#f3ece0] italic">{brandData.storyText1}</p>}{brandData.storyText2 && <p>{brandData.storyText2}</p>}<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#2e3b30] text-center"><div className="p-3 rounded-2xl bg-[#1d251f]"><span className="font-serif text-2xl font-bold text-[#d4af37] block">100%</span><span className="text-[11px] uppercase text-[#a3b0a2] tracking-wider">Laine Vierge Locale</span></div><div className="p-3 rounded-2xl bg-[#1d251f]"><span className="font-serif text-2xl font-bold text-[#d4af37] block">2</span><span className="text-[11px] uppercase text-[#a3b0a2] tracking-wider">Modèles d'Exception</span></div><div className="p-3 rounded-2xl bg-[#1d251f]"><span className="font-serif text-2xl font-bold text-[#d4af37] block">Pyrénées</span><span className="text-[11px] uppercase text-[#a3b0a2] tracking-wider">Conception de Montagne</span></div></div></div>
          </div>
        </div>
      </div>
    </section>
  );
};
