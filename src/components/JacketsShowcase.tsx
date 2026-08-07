import React, { useState } from 'react';
import { JacketModel, Hotspot } from '../types';
import {
  Check,
  Info,
  Shield,
  Feather,
  Sparkles,
  CloudRain,
  Compass,
  SlidersHorizontal,
  Layers,
  MapPin,
  Ruler,
  ShoppingBag,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface JacketsShowcaseProps {
  jackets: [JacketModel, JacketModel];
  selectedJacketId: string;
  onSelectJacket: (id: string) => void;
  onOpenInquiry: (jacketId: string, color?: string, size?: string) => void;
}

export const JacketsShowcase: React.FC<JacketsShowcaseProps> = ({
  jackets,
  selectedJacketId,
  onSelectJacket,
  onOpenInquiry,
}) => {
  const activeJacket = jackets.find((j) => j.id === selectedJacketId) || jackets[0];
  const [activeImage, setActiveImage] = useState(activeJacket.heroImage);
  const [selectedColor, setSelectedColor] = useState(activeJacket.colors[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState(activeJacket.sizes[1] || 'M');
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  // Update image and color when active jacket changes
  React.useEffect(() => {
    setActiveImage(activeJacket.heroImage);
    if (activeJacket.colors.length > 0) {
      setSelectedColor(activeJacket.colors[0].name);
    }
  }, [activeJacket.id]);

  const renderFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-5 h-5 text-[#c2a26d]" />;
      case 'Feather':
        return <Feather className="w-5 h-5 text-[#c2a26d]" />;
      case 'CloudRain':
        return <CloudRain className="w-5 h-5 text-[#c2a26d]" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-[#c2a26d]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#c2a26d]" />;
    }
  };

  return (
    <section id="collection" className="py-20 bg-[#151a16] text-[#e2d5c3] relative overflow-hidden">
      {/* Decorative background mountain graphic accent */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 opacity-5 pointer-events-none">
        <svg className="w-96 h-96 text-[#d4af37]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 6l-3.8 5.7 1.8 2.7H5l7-10 7 10h-2.5l-2.5-3.7z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest text-[#d4af37] font-serif font-medium">
            Mise en valeur exclusive
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-[#f3ece0] mt-2 mb-4">
            Nos 2 Créations Signatures
          </h2>
          <p className="text-sm sm:text-base text-[#a3b1a5] font-sans">
            Deux modèles pensés pour allier l’authenticité du grand air pyrénéen et l’élégance urbaine la plus raffinée.
          </p>
        </div>

        {/* Jacket Selector Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#1e2520] border border-[#3b473e] shadow-xl">
            {jackets.map((j, idx) => {
              const isSelected = j.id === activeJacket.id;
              return (
                <button
                  key={j.id}
                  id={`jacket-tab-${j.id}`}
                  onClick={() => onSelectJacket(j.id)}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all font-medium ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#2c372f] to-[#3b493e] text-[#f3ece0] border border-[#d4af37]/60 shadow-lg'
                      : 'text-[#9eb0a0] hover:text-[#f3ece0]'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-black/40 text-[#d4af37] font-serif text-xs flex items-center justify-center font-bold">
                    N°{idx + 1}
                  </span>
                  <span>{j.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left / Center: Interactive Image Viewer with Hotspots */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative rounded-3xl bg-[#1d241f] border border-[#39483c] overflow-hidden shadow-2xl group min-h-[420px] sm:min-h-[520px] flex items-center justify-center">
              {/* Product Hero Photo */}
              <img
                src={activeImage}
                alt={activeJacket.name}
                className="w-full h-full max-h-[620px] object-cover object-center transition-all duration-500"
              />

              {/* Hotspot Nodes Overlay */}
              {activeJacket.hotspots.map((hs) => {
                const isSelected = activeHotspot?.id === hs.id;
                return (
                  <button
                    key={hs.id}
                    onClick={() => setActiveHotspot(isSelected ? null : hs)}
                    style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                    className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 group/pin focus:outline-none"
                    title={hs.title}
                  >
                    <span className="relative flex h-8 w-8 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-[#1a201b] border-2 border-[#d4af37] text-[#d4af37] text-[10px] font-bold items-center justify-center shadow-lg group-hover/pin:scale-110 transition-transform">
                        +
                      </span>
                    </span>
                  </button>
                );
              })}

              {/* Floating Hotspot Details Card */}
              {activeHotspot && (
                <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-30 p-4 sm:p-5 rounded-2xl bg-[#141915]/95 backdrop-blur-md border border-[#d4af37] shadow-2xl animate-fadeIn">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 text-[#d4af37] text-xs uppercase tracking-wider font-semibold">
                      <Eye className="w-4 h-4" />
                      <span>Détail d'Atelier • {activeHotspot.category}</span>
                    </div>
                    <button
                      onClick={() => setActiveHotspot(null)}
                      className="text-[#9eb0a0] hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-black/40"
                    >
                      ✕
                    </button>
                  </div>
                  <h4 className="font-serif text-lg text-[#f3ece0] font-semibold mt-1">
                    {activeHotspot.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#b8c5ba] mt-1 leading-relaxed">
                    {activeHotspot.description}
                  </p>
                </div>
              )}

              {/* Badge Overlay Top Right */}
              <div className="absolute top-4 right-4 z-10 flex flex-col items-end space-y-2">
                <span className="px-3 py-1 rounded-full bg-[#121613]/90 backdrop-blur-md border border-[#3b473e] text-[#d4af37] text-xs font-serif tracking-widest uppercase">
                  {activeJacket.category}
                </span>
                <span className="text-[10px] text-[#a3b0a2] bg-black/60 px-2 py-0.5 rounded">
                  💡 Cliquez sur les points <span>+</span> pour inspecter
                </span>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {activeJacket.gallery && activeJacket.gallery.length > 1 && (
              <div className="flex items-center space-x-3 overflow-x-auto pb-1">
                {activeJacket.gallery.map((imgUrl, idx) => {
                  const isActive = activeImage === imgUrl;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                        isActive
                          ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40 scale-105'
                          : 'border-[#39483c] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Vue ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fabrics Badges */}
            <div className="p-4 rounded-2xl bg-[#1e2520] border border-[#354337] flex flex-wrap items-center justify-between gap-3 text-xs text-[#b8c5ba]">
              <span className="font-serif text-[#d4af37] font-semibold uppercase tracking-wider">
                Composition Noble :
              </span>
              <div className="flex flex-wrap gap-2">
                {activeJacket.fabrics.map((fabric, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#28322a] border border-[#435346] text-[#e2d5c3]"
                  >
                    {fabric}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Product Details, Customization & Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-[#a3b1a5] font-serif">
                  {activeJacket.subTitle}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-[#382b1c] text-[#d4af37] border border-[#8c6d3f]">
                  Sur Commande
                </span>
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#f3ece0] font-normal mt-1">
                {activeJacket.name}
              </h3>
              <p className="text-sm text-[#c2a26d] italic font-serif mt-1">
                "{activeJacket.tagline}"
              </p>

              <div className="mt-4 flex items-baseline space-x-3">
                <span className="font-serif text-3xl font-semibold text-[#f3ece0]">
                  {activeJacket.price} {activeJacket.currency}
                </span>
                <span className="text-xs text-[#a3b0a2]">
                  TVA incluse • Livraison offerte en France & Europe
                </span>
              </div>
            </div>

            <hr className="border-[#2f3b31]" />

            {/* Description */}
            <p className="text-sm text-[#b8c5ba] leading-relaxed">
              {activeJacket.longDescription}
            </p>

            {/* Color Selection */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium mb-2">
                Couleur sélectionnée : <span className="text-[#f3ece0] font-semibold">{selectedColor}</span>
              </label>
              <div className="flex items-center space-x-3">
                {activeJacket.colors.map((color) => {
                  const isChosen = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isChosen ? 'ring-2 ring-[#d4af37] ring-offset-2 ring-offset-[#151a16] scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {isChosen && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                  Taille : <span className="text-[#f3ece0] font-semibold">{selectedSize}</span>
                </label>
                <button
                  onClick={() => alert("Guide des tailles Pyrénéen : Coupe ajustée chic. Si vous prévoyez de porter un gros pull en laine en dessous, privilégiez la taille supérieure.")}
                  className="text-xs text-[#d4af37] hover:underline flex items-center space-x-1"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Guide des tailles</span>
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {activeJacket.sizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`py-2 text-xs uppercase tracking-wider font-semibold rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#d4af37] text-[#121613] border-[#d4af37] shadow-md'
                          : 'bg-[#1e2520] text-[#c4ceb8] border-[#374639] hover:border-[#a3b0a2]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Technical Quick Specs Cards */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#1e2520] border border-[#354337]">
                  <span className="block text-[#a3b0a2] text-[10px] uppercase tracking-wider">Origine</span>
                  <span className="font-semibold text-[#f3ece0]">{activeJacket.specs.origin}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1e2520] border border-[#354337]">
                  <span className="block text-[#a3b0a2] text-[10px] uppercase tracking-wider">Résistance</span>
                  <span className="font-semibold text-[#f3ece0]">{activeJacket.specs.waterResistance}</span>
                </div>
              </div>
            </div>

            {/* Call to Action Button */}
            <div className="pt-4 space-y-3">
              <button
                id={`buy-jacket-${activeJacket.id}`}
                onClick={() => onOpenInquiry(activeJacket.id, selectedColor, selectedSize)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#b89f74] via-[#d4af37] to-[#8c6d3f] text-[#121613] font-serif font-bold text-base uppercase tracking-widest hover:brightness-110 transition-all shadow-xl hover:shadow-[#d4af37]/20 flex items-center justify-center space-x-3"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Commander / Réserver un essayage ({activeJacket.price} {activeJacket.currency})</span>
              </button>

              <p className="text-[11px] text-center text-[#a3b0a2] flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Atelier artisanal local • Réponse personnalisée sous 24h</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
