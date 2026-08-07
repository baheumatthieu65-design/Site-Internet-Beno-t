import React from 'react';
import { BrandConfig } from '../types';
import { Mountain, Feather, Heart, Sparkles, MapPin, ShieldCheck, Quote } from 'lucide-react';

interface BrandStoryProps {
  brandData: BrandConfig;
}

export const BrandStory: React.FC<BrandStoryProps> = ({ brandData }) => {
  return (
    <section id="origines" className="py-24 bg-[#181e19] text-[#e2d5c3] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Brand Logo & Emblem Display */}
          <div className="lg:col-span-5 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#273229] border border-[#3e4e41] text-[#d4af37] text-xs font-serif uppercase tracking-widest">
              <Mountain className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Savoir-Faire Pyrénéen</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-light text-[#f3ece0] leading-tight">
              {brandData.storyTitle}
            </h2>

            <div className="relative p-6 rounded-3xl bg-[#202922] border border-[#3b4b3e] shadow-2xl space-y-4">
              <div className="flex items-center space-x-4">
                {brandData.logoUrl && (
                  <img
                    src={brandData.logoUrl}
                    alt={brandData.brandName}
                    className="w-16 h-16 rounded-full border-2 border-[#d4af37] shadow-lg object-cover"
                  />
                )}
                <div>
                  <h3 className="font-serif text-xl text-[#f3ece0] font-semibold">
                    {brandData.brandName}
                  </h3>
                  <p className="text-xs text-[#a3b1a5] uppercase tracking-wider">
                    {brandData.designerLocation}
                  </p>
                </div>
              </div>

              <blockquote className="text-sm italic text-[#d0c5b4] font-serif border-l-2 border-[#d4af37] pl-4 py-1">
                "{brandData.tagline}"
              </blockquote>
            </div>

            {/* Manifesto Bullet Points */}
            <div className="space-y-3 pt-2">
              {brandData.manifesto.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-sm text-[#b8c5ba]">
                  <ShieldCheck className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Story Narrative */}
          <div className="lg:col-span-7 space-y-6 text-sm sm:text-base text-[#b8c5ba] leading-relaxed">
            <div className="p-8 rounded-3xl bg-[#141915]/80 border border-[#2e3b30] shadow-xl space-y-6">
              <Quote className="w-10 h-10 text-[#d4af37]/30" />
              
              <p className="font-serif text-lg text-[#f3ece0] italic">
                {brandData.storyText1}
              </p>

              <p>
                {brandData.storyText2}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#2e3b30] text-center">
                <div className="p-3 rounded-2xl bg-[#1d251f]">
                  <span className="font-serif text-2xl font-bold text-[#d4af37] block">100%</span>
                  <span className="text-[11px] uppercase text-[#a3b0a2] tracking-wider">Laine Vierge Locale</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#1d251f]">
                  <span className="font-serif text-2xl font-bold text-[#d4af37] block">2</span>
                  <span className="text-[11px] uppercase text-[#a3b0a2] tracking-wider">Modèles d'Exception</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#1d251f]">
                  <span className="font-serif text-2xl font-bold text-[#d4af37] block">Pyrénées</span>
                  <span className="text-[11px] uppercase text-[#a3b0a2] tracking-wider">Conception de Montagne</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
