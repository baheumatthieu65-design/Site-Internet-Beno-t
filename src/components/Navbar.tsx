import React, { useState, useEffect } from 'react';
import { BrandConfig } from '../types';
import { Sliders, Sparkles, Lock, ShieldCheck, ChevronDown, Mountain, Compass, Palette, Layers } from 'lucide-react';
import { getButtonClasses } from '../utils/themeStyles';

interface NavbarProps {
  brandData: BrandConfig;
  isAdminLoggedIn: boolean;
  onOpenLogin: () => void;
  onOpenCustomizer: (tab?: 'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security') => void;
  onOpenInquiry: (jacketId?: string) => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  brandData,
  isAdminLoggedIn,
  onOpenLogin,
  onOpenCustomizer,
  onOpenInquiry,
  activeSection,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const theme = brandData.theme;
  const primaryBtnClass = getButtonClasses(theme, 'primary');
  const orderText = theme?.orderButtonText || 'Commander';
  const badgeText = theme?.heroBadgeText || 'Pyrénées • Édition Limitée';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'collection', label: 'Les 2 Vestes' },
    { id: 'comparatif', label: 'Comparatif' },
    { id: 'origines', label: 'L’Esprit Pyrénées' },
    { id: 'lookbook', label: 'Lookbook' },
    { id: 'contact', label: 'Contact & Atelier' },
  ];

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-nav-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#1a1e1b]/95 backdrop-blur-md border-b border-[#3b473e]/50 py-3 shadow-xl'
          : 'bg-gradient-to-b from-black/85 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <button
          id="nav-logo-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center space-x-3 text-left group cursor-pointer"
        >
          {brandData.logoUrl ? (
            <img
              src={brandData.logoUrl}
              alt={brandData.brandName}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[#b89f74]/50 group-hover:border-[#d4af37] transition-all shadow-md"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#3b473e] flex items-center justify-center text-[#e2d5c3] font-serif font-bold">
              MP
            </div>
          )}
          <div>
            <span className="block font-serif text-lg sm:text-xl tracking-widest text-[#f3ece0] font-semibold group-hover:text-[#d4af37] transition-colors">
              {brandData.brandName}
            </span>
            <span className="block text-[10px] tracking-wider uppercase text-[#a3b1a5] font-light">
              {badgeText}
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav id="desktop-nav" className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              id={`nav-link-${link.id}`}
              onClick={() => scrollTo(link.id)}
              className={`text-sm uppercase tracking-widest font-medium transition-all py-1 border-b-2 cursor-pointer ${
                activeSection === link.id
                  ? 'border-[#d4af37] text-[#f3ece0]'
                  : 'border-transparent text-[#c4ceb8] hover:text-[#f3ece0] hover:border-[#b89f74]/50'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Admin Toggle Button */}
          {isAdminLoggedIn ? (
            <div className="flex items-center space-x-1.5">
              <button
                id="open-customizer-btn"
                onClick={() => onOpenCustomizer('theme')}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs tracking-wider uppercase rounded-full bg-[#2a372e] text-[#f3ece0] border border-[#d4af37]/70 hover:bg-[#34463a] transition-all shadow-sm ring-1 ring-[#d4af37]/40 cursor-pointer"
                title="Panneau d'Administration : Modifier les boutons, formats, vestes & textes"
              >
                <Sliders className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="hidden sm:inline font-medium">Personnaliser</span>
              </button>
            </div>
          ) : (
            <button
              id="open-login-btn"
              onClick={onOpenLogin}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs tracking-wider uppercase rounded-full bg-[#202722] text-[#c0cdb5] border border-[#374639] hover:border-[#b89f74] hover:text-[#f3ece0] hover:bg-[#28322b] transition-all cursor-pointer"
              title="Connexion Espace Administrateur"
            >
              <Lock className="w-3 h-3 text-[#b89f74]" />
              <span className="hidden sm:inline">Accès Admin</span>
            </button>
          )}

          {/* Commander / Inquiry Button Styled via active buttonStyle */}
          <button
            id="nav-order-btn"
            onClick={() => onOpenInquiry()}
            className={`flex items-center space-x-2 px-5 py-2 text-xs tracking-widest uppercase font-semibold ${primaryBtnClass}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{orderText}</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#c4ceb8] hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="md:hidden bg-[#181d19] border-b border-[#3b473e] px-4 pt-4 pb-6 mt-2 space-y-3 animate-fadeIn">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="block w-full text-left py-2 text-sm uppercase tracking-widest text-[#e2d5c3] hover:text-[#d4af37] border-b border-[#2a332d]"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 flex flex-col space-y-2">
            {isAdminLoggedIn ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCustomizer('theme');
                }}
                className="w-full text-center py-2.5 rounded-xl bg-[#28362b] text-[#f3ece0] text-xs uppercase tracking-wider border border-[#d4af37]/70 font-semibold"
              >
                ⚙️ Panneau d'Administration (Personnaliser Tout)
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full text-center py-2.5 rounded-xl bg-[#202722] text-[#c0cdb5] text-xs uppercase tracking-wider border border-[#374639] flex items-center justify-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#b89f74]" />
                <span>Connexion Administrateur</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
