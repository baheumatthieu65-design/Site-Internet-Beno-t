import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { JacketModel, ThemeConfig } from '../types';
import { Camera, Eye, Sparkles, ZoomIn, Edit3 } from 'lucide-react';
import { sortProductsByAvailability } from '../utils/productOrdering';
import { getProductAvailabilityStatus, getProductStatusLabel, isProductOrderable } from '../utils/productStatus';
import {
  getButtonClasses,
  getButtonInlineStyle,
  getCardClasses,
  getTextAlignClass,
  getContentPaddingClass,
  getContainerWidthClass,
} from '../utils/themeStyles';

interface LookbookGalleryProps {
  jackets: JacketModel[];
  heroBgImage: string;
  theme?: ThemeConfig;
  isAdminLoggedIn?: boolean;
  onOpenEditorSection?: (tab: 'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security') => void;
  onOpenInquiry: (jacketId: string) => void;
}

export const LookbookGallery: React.FC<LookbookGalleryProps> = ({
  jackets,
  heroBgImage,
  theme,
  isAdminLoggedIn,
  onOpenEditorSection,
  onOpenInquiry,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const cardStyle = getCardClasses(theme);
  const primaryBtnClass = getButtonClasses(theme, 'primary', 'lookbook-order');
  const buttonInlineStyle = getButtonInlineStyle(theme, 'lookbook-order');
  const orderText = theme?.orderButtonText || 'Commander';

  const textAlignClass = getTextAlignClass(theme);
  const containerWidthClass = getContainerWidthClass(theme);
  const contentPaddingClass = getContentPaddingClass(theme);
  const lookbookImageScale = 100;
  const selectedProductIds = Array.isArray(theme?.lookbookProductIds) ? theme.lookbookProductIds : [];
  const lookbookJackets = sortProductsByAvailability(
    selectedProductIds.length > 0 ? jackets.filter((j) => selectedProductIds.includes(j.id)) : jackets
  );
  const lookbookFrameHeight = Math.min(500, Math.max(160, Number(theme?.lookbookImageFrameHeight ?? 220)));
  const lookbookFrameWidth = Math.min(100, Math.max(40, Number(theme?.lookbookImageFrameWidth ?? 60)));

  // Un bloc = un article. Le Lookbook utilise toujours heroImage comme visuel principal.
  const galleryItems = lookbookJackets.map((j, jIdx) => ({
    jacketId: j.id,
    url: j.heroImage,
    title: j.name,
    model: j.subTitle || j.tagline,
    location: j.category || `Création N°${jIdx + 1}`,
    status: getProductAvailabilityStatus(j),
    statusLabel: getProductStatusLabel(j),
    price: `${j.price} ${j.currency}`,
  }));

  return (
    <section id="lookbook" className={`${contentPaddingClass} bg-[#121613] text-[#e2d5c3] relative group/lookbook`}>
      {/* Admin Quick Edit Trigger */}
      {isAdminLoggedIn && onOpenEditorSection && (
        <div className="absolute top-8 right-6 z-30 opacity-90 hover:opacity-100 transition-opacity">
          <button
            onClick={() => onOpenEditorSection('j1')}
            className="flex items-center space-x-1.5 bg-[#1b241d]/90 backdrop-blur-md border border-[#d4af37]/60 px-3 py-1.5 rounded-full shadow-2xl text-xs text-[#d4af37]"
            title="Modifier les photos du lookbook et des vestes"
          >
            <Edit3 className="w-3 h-3" />
            <span>Éditer les Photos</span>
          </button>
        </div>
      )}

      <div className={`${containerWidthClass} px-4 sm:px-6 lg:px-8`}>
        {/* Header */}
        <div className={`${textAlignClass} max-w-3xl mx-auto mb-16`}>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#242e26] text-[#d4af37] text-xs uppercase tracking-widest font-serif mb-3">
            <Camera className="w-3.5 h-3.5" />
            <span>Galerie Editorial</span>
          </div>
          <h2 data-vce-id="lookbook-title" className="font-serif text-3xl sm:text-5xl font-light text-[#f3ece0]">
            Lookbook Champêtre
          </h2>
          <p data-vce-id="lookbook-subtitle" className="text-sm text-[#a3b0a2] mt-3 font-sans">
            Mise en scène de nos créations au cœur des paysages sauvages des Pyrénées.
          </p>
        </div>

        {/* Editorial Grid : une carte par article, image + texte en pied */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item) => (
            <article
              key={item.jacketId}
              className="group relative cursor-pointer rounded-2xl overflow-hidden bg-[#1a201b] border border-[#374739] shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-[#d4af37]"
              onClick={() => setSelectedImage(item.url)}
            >
              <div className="relative w-full overflow-hidden bg-[#111612]" style={{ height: `${lookbookFrameHeight}px` }}>
                <img src={item.url} alt={item.title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className={`absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold border shadow-lg ${item.status === 'on-sale' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600' : item.status === 'sold-out' ? 'bg-red-950/90 text-red-300 border-red-800' : 'bg-amber-950/90 text-amber-200 border-amber-700'}`}>
                  {item.statusLabel}
                </span>
              </div>

              <div className="p-5 bg-[#171e19]">
                <span className="text-[9px] uppercase tracking-[0.18em] text-[#d4af37] font-semibold">{item.location}</span>
                <div className="flex items-end justify-between gap-3 mt-1">
                  <div className="min-w-0">
                    <h3 className="font-serif text-2xl text-[#f3ece0] font-medium truncate">{item.title}</h3>
                    <p className="text-[11px] text-[#a3b0a2] mt-1 line-clamp-2">{item.model}</p>
                  </div>
                  <span className="font-serif text-lg text-[#d4af37] shrink-0">{item.price}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-[#7f9382]">Voir la pièce</span>
                  <button onClick={(e) => { e.stopPropagation(); if (item.status === 'on-sale') onOpenInquiry(item.jacketId); }} disabled={item.status !== 'on-sale'} style={buttonInlineStyle} className={`px-4 py-2 text-[9px] uppercase tracking-wider font-bold ${primaryBtnClass} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {item.status === 'on-sale' ? orderText : item.statusLabel}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && typeof document !== 'undefined'
        ? createPortal(
            <div
              onClick={() => setSelectedImage(null)}
              className="lookbook-lightbox fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
              role="dialog"
              aria-modal="true"
              aria-label="Image Lookbook agrandie"
            >
              <div
                className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-[#d4af37]"
                onClick={(event) => event.stopPropagation()}
              >
                <img src={selectedImage} alt="Lookbook Full" className="max-w-full max-h-[85vh] object-contain" />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 z-10 bg-black/80 text-white p-2 rounded-full font-bold hover:bg-[#d4af37] hover:text-black transition-colors"
                  aria-label="Fermer l'image agrandie"
                >
                  ✕
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
};
