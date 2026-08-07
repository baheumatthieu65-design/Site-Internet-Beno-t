import React from 'react';
import { BrandConfig } from '../types';
import { Mountain, Mail, MapPin, Phone, Instagram, Send, Sparkles } from 'lucide-react';

interface FooterProps {
  brandData: BrandConfig;
  onOpenCustomizer: () => void;
  onOpenInquiry: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  brandData,
  onOpenCustomizer,
  onOpenInquiry,
}) => {
  return (
    <footer id="contact" className="bg-[#0e120f] text-[#e2d5c3] border-t border-[#2a352c] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#222b24]">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              {brandData.logoUrl && (
                <img
                  src={brandData.logoUrl}
                  alt={brandData.brandName}
                  className="w-12 h-12 rounded-full border border-[#d4af37] object-cover"
                />
              )}
              <div>
                <span className="font-serif text-2xl font-semibold text-[#f3ece0] block">
                  {brandData.brandName}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-serif">
                  Édition Limitée des Pyrénées
                </span>
              </div>
            </div>

            <p className="text-xs text-[#a3b1a5] leading-relaxed max-w-sm">
              {brandData.subtitle}
            </p>

            <div className="pt-2 text-xs text-[#b8c5ba] space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#d4af37]" />
                <span>Atelier : {brandData.designerLocation}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-[#d4af37]" />
                <span>{brandData.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-serif text-sm uppercase tracking-widest text-[#f3ece0] font-semibold">
              Collection & Esprit
            </h4>
            <ul className="space-y-2 text-xs text-[#a3b1a5]">
              <li>
                <a href="#collection" className="hover:text-[#d4af37] transition-colors">
                  Veste N°1 : {brandData.jackets[0].name}
                </a>
              </li>
              <li>
                <a href="#collection" className="hover:text-[#d4af37] transition-colors">
                  Veste N°2 : {brandData.jackets[1].name}
                </a>
              </li>
              <li>
                <a href="#comparatif" className="hover:text-[#d4af37] transition-colors">
                  Tableau Comparatif des Modèles
                </a>
              </li>
              <li>
                <a href="#origines" className="hover:text-[#d4af37] transition-colors">
                  Histoire & Terroir Pyrénéen
                </a>
              </li>
              <li>
                <a href="#lookbook" className="hover:text-[#d4af37] transition-colors">
                  Lookbook Editorial
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter / Contact Box */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-serif text-sm uppercase tracking-widest text-[#f3ece0] font-semibold">
              Restez Informé des Éditions
            </h4>
            <p className="text-xs text-[#a3b1a5]">
              Recevez les invitations exclusives pour nos lancements et réassorts de laine vierge pyrénéenne.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Merci ! Vous êtes inscrit aux communications exclusives de la Maison des Pyrénées.");
              }}
              className="flex space-x-2"
            >
              <input
                type="email"
                required
                placeholder="votre.email@domaine.fr"
                className="flex-1 bg-[#1a221c] border border-[#313f33] text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#d4af37] text-[#121613] text-xs uppercase font-bold rounded-xl hover:brightness-110 flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="pt-2">
              <button
                onClick={onOpenInquiry}
                className="w-full py-2.5 rounded-xl bg-[#222d25] border border-[#3e5041] text-[#e2d5c3] text-xs uppercase tracking-wider font-semibold hover:border-[#d4af37] transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Prendre Rendez-vous à l'Atelier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#7a8a7c] space-y-4 sm:space-y-0">
          <div>
            © {new Date().getFullYear()} {brandData.brandName}. Fait avec passion dans les Pyrénées.
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={onOpenCustomizer} className="hover:text-[#d4af37] transition-colors underline">
              Éditeur de Site & Contenu
            </button>
            <span className="text-[#354337]">|</span>
            <span>Design Champêtre Chic & Haute Montagne</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
