import React, { useState } from 'react';
import { JacketModel } from '../types';
import { Camera, Eye, Sparkles, ZoomIn } from 'lucide-react';

interface LookbookGalleryProps {
  jackets: [JacketModel, JacketModel];
  heroBgImage: string;
  onOpenInquiry: (jacketId: string) => void;
}

export const LookbookGallery: React.FC<LookbookGalleryProps> = ({
  jackets,
  heroBgImage,
  onOpenInquiry,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const galleryItems = [
    {
      url: jackets[0].heroImage,
      title: 'La Veste des Cimes — Portrait',
      model: jackets[0].name,
      jacketId: jackets[0].id,
      location: 'Pic du Midi, Pyrénées',
    },
    {
      url: jackets[0].gallery[1] || jackets[0].heroImage,
      title: 'Drapeau de Laine sur les Crêtes',
      model: 'Silhouette Sommet N°1',
      jacketId: jackets[0].id,
      location: 'Cirque de Gavarnie',
    },
    {
      url: jackets[0].gallery[2] || jackets[0].heroImage,
      title: 'Focus Matière : Laine Feutrée Vierge',
      model: 'Macro Tissage & Boutons Corne',
      jacketId: jackets[0].id,
      location: 'Détail d’Atelier',
    },
    {
      url: jackets[1].heroImage,
      title: 'Le Manteau Pastorale — Portrait',
      model: jackets[1].name,
      jacketId: jackets[1].id,
      location: 'Vallée d’Aspe',
    },
    {
      url: jackets[1].gallery[1] || jackets[1].heroImage,
      title: 'Coton Huilé aux Pâturages',
      model: 'Chic Champêtre N°2',
      jacketId: jackets[1].id,
      location: 'Pâturages de Lourdios',
    },
    {
      url: jackets[1].gallery[2] || jackets[1].heroImage,
      title: 'Focus Imperméabilité & Cire d’Abeille',
      model: 'Macro Coton Waxé & Cuir',
      jacketId: jackets[1].id,
      location: 'Détail d’Atelier',
    },
  ];

  return (
    <section id="lookbook" className="py-20 bg-[#121613] text-[#e2d5c3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#242e26] text-[#d4af37] text-xs uppercase tracking-widest font-serif mb-3">
            <Camera className="w-3.5 h-3.5" />
            <span>Galerie Editorial</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-[#f3ece0]">
            Lookbook Champêtre
          </h2>
          <p className="text-sm text-[#a3b0a2] mt-3 font-sans">
            Mise en scène de nos 2 vestes au cœur des paysages sauvages des Pyrénées.
          </p>
        </div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImage(item.url)}
              className="group relative cursor-pointer rounded-3xl overflow-hidden bg-[#1a201b] border border-[#374739] shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-[#d4af37]"
            >
              <div className="aspect-[4/5] w-full overflow-hidden relative">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
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
                    className="px-3 py-1 text-[10px] uppercase tracking-wider bg-[#d4af37] text-[#121613] font-bold rounded-lg hover:brightness-110"
                  >
                    Commander
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
