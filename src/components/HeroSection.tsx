import React from 'react';
import { BrandConfig } from '../types';
import { Mountain, ArrowDown, Sparkles, Shield, Compass, ChevronRight } from 'lucide-react';

interface HeroSectionProps {
  brandData: BrandConfig;
  onSelectJacket: (jacketId: string) => void;
  onOpenInquiry: (jacketId?: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  brandData,
  onSelectJacket,
  onOpenInquiry,
}) => {
  const jacket1 = brandData.jackets[0];
  const jacket2 = brandData.jackets[1];

  const scrollToCollection = () => {
    const el = document.getElementById('collection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero-section" className="relative min-h-screen flex flex-col justify-between pt-28 pb-12 overflow-hidden bg-[#121613]">
      {/* Background Pyrenees Image with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={brandData.heroBgImage}
          alt="Les Pyrénées"
          className="w-full h-full object-cover object-center scale-105 animate-pulse-subtle opacity-40 mix-blend-luminosity"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121613] via-[#121613]/70 to-black/60" />
        <div className="absolute inset-0 bg-radial-vignette opacity-80" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-16 flex-1 flex flex-col justify-center">
        {/* Top Heritage Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#273229]/80 backdrop-blur-md border border-[#4d5e50] text-[#d4af37] text-xs font-serif tracking-widest uppercase shadow-xl">
            <Mountain className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{brandData.designerLocation}</span>
            <span className="text-[#627666]">|</span>
            <span className="text-[#e2d5c3]">Création {brandData.foundingYear}</span>
          </div>
        </div>

        {/* Title & Taglines */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light text-[#f5eedf] tracking-tight leading-tight">
            <span className="block font-serif italic text-[#c2a26d] font-normal text-3xl sm:text-5xl md:text-6xl mb-1">
              Thème Champêtre & Élégance
            </span>
            {brandData.brandName}
          </h1>

          <p className="text-lg sm:text-2xl text-[#d0c5b4] font-serif font-light max-w-2xl mx-auto italic">
            "{brandData.tagline}"
          </p>

          <p className="text-sm sm:text-base text-[#a3b0a2] max-w-xl mx-auto leading-relaxed font-sans pt-2">
            {brandData.subtitle}
          </p>
        </div>

        {/* The 2 Jackets Quick Display Cards in Hero */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
          {/* Jacket 1 Card */}
          <div
            onClick={() => onSelectJacket(jacket1.id)}
            className="group relative cursor-pointer rounded-2xl bg-[#1e2520]/80 backdrop-blur-md border border-[#3d4c40] hover:border-[#d4af37] p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-[#d4af37]/10 flex items-center space-x-4"
          >
            <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-black/40 flex-shrink-0">
              <img
                src={jacket1.heroImage}
                alt={jacket1.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2 left-2 bg-[#121613]/90 text-[#d4af37] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-serif border border-[#3d4c40]">
                N°1
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] uppercase tracking-widest text-[#a3b1a5] font-medium block">
                {jacket1.category}
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-[#f3ece0] font-semibold truncate group-hover:text-[#d4af37] transition-colors">
                {jacket1.name}
              </h3>
              <p className="text-xs text-[#a8b5a9] line-clamp-2 mt-1">
                {jacket1.description}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-serif text-base font-semibold text-[#c2a26d]">
                  {jacket1.price} {jacket1.currency}
                </span>
                <span className="text-xs text-[#d4af37] group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1 font-medium">
                  <span>Découvrir</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Jacket 2 Card */}
          <div
            onClick={() => onSelectJacket(jacket2.id)}
            className="group relative cursor-pointer rounded-2xl bg-[#1e2520]/80 backdrop-blur-md border border-[#3d4c40] hover:border-[#d4af37] p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-[#d4af37]/10 flex items-center space-x-4"
          >
            <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-black/40 flex-shrink-0">
              <img
                src={jacket2.heroImage}
                alt={jacket2.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2 left-2 bg-[#121613]/90 text-[#d4af37] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-serif border border-[#3d4c40]">
                N°2
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] uppercase tracking-widest text-[#a3b1a5] font-medium block">
                {jacket2.category}
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-[#f3ece0] font-semibold truncate group-hover:text-[#d4af37] transition-colors">
                {jacket2.name}
              </h3>
              <p className="text-xs text-[#a8b5a9] line-clamp-2 mt-1">
                {jacket2.description}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-serif text-base font-semibold text-[#c2a26d]">
                  {jacket2.price} {jacket2.currency}
                </span>
                <span className="text-xs text-[#d4af37] group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1 font-medium">
                  <span>Découvrir</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Badges below */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs uppercase tracking-widest text-[#a3b0a2]">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#c2a26d]" />
            <span>Matières 100% Nobles</span>
          </div>
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-[#c2a26d]" />
            <span>Conçu dans les Pyrénées</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#c2a26d]" />
            <span>Série Limitée sur Mesure</span>
          </div>
        </div>
      </div>

      {/* Down Arrow */}
      <div className="relative z-10 text-center pt-8">
        <button
          onClick={scrollToCollection}
          className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#a3b0a2] hover:text-[#d4af37] transition-colors group"
        >
          <span>Découvrir la collection en détails</span>
          <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform text-[#d4af37]" />
        </button>
      </div>
    </section>
  );
};
