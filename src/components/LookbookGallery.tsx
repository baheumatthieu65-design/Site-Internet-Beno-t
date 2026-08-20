import React, { useState } from 'react';
import { JacketModel, ThemeConfig } from '../types';
import { Camera, Eye, Sparkles, ZoomIn, Edit3 } from 'lucide-react';
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
  const lookbookImageScale = Math.min(100, Math.max(30, Number(theme?.lookbookImageScale ?? 60)));
  const lookbookFrameHeight = Math.min(800, Math.max(220, Number(theme?.lookbookImageFrameHeight ?? 360)));

  // Dynamic gallery items created from all registered jackets
  const galleryItems = jackets.flatMap((j, jIdx) => {
    const images = Array.from(
      new Set(
        [j.heroImage, ...(Array.isArray(j.gallery) ? j.gallery : [])]
          .map((url) => String(url || '').trim())
          .filter(Boolean)
      )
    );

    return images.map((url, imageIndex) => ({
      url,
      title:
        imageIndex === 0
          ? `${j.name} — Portrait & Silhouette`
          : imageIndex === 1
            ? `${j.name} — Vue en Déplacement`
            : `Focus Matières & Finitions — ${j.name}`,
      model:
        imageIndex === 0
          ? j.name
          : imageIndex === 1
            ? `Silhouette Signature N°${jIdx + 1}`
            : j.fabrics[0] || 'Tissage Artisanal Noble',
      jacketId: j.id,
      location:
        imageIndex === 0
          ? `Atelier Pyrénéen • Création N°${jIdx + 1}`
          : imageIndex === 1
            ? 'Massif des Pyrénées'
            : 'Détail d’Atelier',
    }));
  });

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

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImage(item.url)}
              className="group relative cursor-pointer rounded-3xl overflow-hidden bg-[#1a201b] border border-[#374739] shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-[#d4af37]"
            >
              <div
                className="w-full overflow-hidden relative flex items-center justify-center bg-[#111612]"
                style={{ height: `${lookbookFrameHeight}px` }}
              >
                <div className="relative h-full flex items-center justify-center overflow-hidden" style={{ width: `${lookbookImageScale}%` }}>
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-semibold block">
                  {item.location}
                </span>
                <h3 className="font-serif text-xl text-[#f3ece0] font-medium">
                  {item.title}
                </h3>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-[#a3b0a2]">
                    {item.model}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenInquiry(item.jacketId);
                    }}
                style={buttonInlineStyle}
                    className={`px-3.5 py-1.5 text-[10px] uppercase tracking-wider font-bold ${primaryBtnClass}`}
                  >
                    {orderText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-[#d4af37]">
            <img src={selectedImage} alt="Lookbook Full" className="max-w-full max-h-[85vh] object-contain" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded-full font-bold hover:bg-[#d4af37] hover:text-black transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
