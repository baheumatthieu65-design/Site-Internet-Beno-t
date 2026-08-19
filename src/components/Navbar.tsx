import React, { useState, useEffect } from 'react';
import { BrandConfig } from '../types';
import { Sparkles } from 'lucide-react';
import { getButtonClasses } from '../utils/themeStyles';
import adminSheep from '../assets/admin-sheep.png';
import { LogoBlock } from './LogoBlock';

interface NavbarProps {
  brandData: BrandConfig;
  isAdminLoggedIn: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenCustomizer: (tab?: 'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security') => void;
  onOpenInquiry: (jacketId?: string) => void;
  activeSection: string;
  onOpenGite?: () => void;
}

declare global { interface Window { __pyreneesOpenAdminOrders?: () => void; } }

export const Navbar: React.FC<NavbarProps> = ({ brandData, isAdminLoggedIn, onOpenLogin, onLogout, onOpenCustomizer, onOpenInquiry, activeSection, onOpenGite }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = brandData.theme;
  const primaryBtnClass = getButtonClasses(theme, 'primary', 'navbar-order');
  const orderText = theme?.orderButtonText || 'Commander';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hiddenSections = theme?.hiddenSections || [];
  const defaultNavOrder = ['collection', 'comparatif', 'origines', 'lookbook', 'contact'] as const;
  const allNavLinks = [
    { id: 'collection', label: theme?.collectionTabLabel || 'Les 2 Vestes' },
    { id: 'comparatif', label: theme?.comparatifTabLabel || 'Tableau Comparatif' },
    { id: 'origines', label: theme?.originesTabLabel || 'L’Esprit Pyrénées' },
    { id: 'lookbook', label: theme?.lookbookTabLabel || 'Lookbook' },
    { id: 'contact', label: theme?.contactTabLabel || 'Contact & Atelier' },
  ];
  const navOrder = theme?.navOrder?.length ? theme.navOrder : defaultNavOrder;
  const navLinks = navOrder.map(id => allNavLinks.find(link => link.id === id)).filter((link): link is (typeof allNavLinks)[number] => Boolean(link)).filter(link => !hiddenSections.includes(link.id as typeof hiddenSections[number]));
  const scrollTo = (id: string) => { setMobileMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
  const openOrders = () => { if (isAdminLoggedIn) window.__pyreneesOpenAdminOrders?.(); };
  const openGite = () => { setMobileMenuOpen(false); onOpenGite?.(); };

  const logoPair = (
    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
      <LogoBlock brandData={brandData} kind="boutique" compact onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
      <span className="hidden sm:block h-10 w-[2px] bg-[#d4af37]/80 rotate-[15deg]" aria-hidden="true" />
      <LogoBlock brandData={brandData} kind="gite" compact onClick={openGite} />
    </div>
  );

  return (
    <header id="main-nav-header" className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#1a1e1b]/95 backdrop-blur-md border-b border-[#3b473e]/50 py-3 shadow-xl' : 'bg-gradient-to-b from-black/85 via-black/40 to-transparent py-4'}`}>
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {logoPair}
        <nav id="desktop-nav" className="hidden xl:flex items-center gap-5 2xl:gap-7 ml-auto">
          {navLinks.map(link => <button key={link.id} id={`nav-link-${link.id}`} onClick={() => scrollTo(link.id)} className={`text-sm uppercase tracking-widest font-medium transition-all py-1 border-b-2 cursor-pointer ${activeSection === link.id ? 'border-[#d4af37] text-[#f3ece0]' : 'border-transparent text-[#c4ceb8] hover:text-[#f3ece0] hover:border-[#b89f74]/50'}`}>{link.label}</button>)}
        </nav>
        <div className="flex items-center space-x-2 shrink-0">
          {isAdminLoggedIn && <button id="nav-orders-btn" onClick={openOrders} className="hidden sm:flex items-center px-3 py-1.5 text-xs tracking-wider uppercase rounded-full bg-[#2a372e] text-[#d4af37] border border-[#d4af37]/70 hover:bg-[#34463a] transition-all shadow-sm">Commandes</button>}
          <button id="nav-order-btn" onClick={() => onOpenInquiry()} className={`ml-2 flex items-center space-x-2 px-5 py-2 text-xs tracking-widest uppercase font-semibold ${primaryBtnClass}`}><Sparkles className="w-3.5 h-3.5" /><span>{orderText}</span></button>
          <button id="nav-admin-login-btn" type="button" onClick={isAdminLoggedIn ? onLogout : onOpenLogin} aria-label={isAdminLoggedIn ? 'Se déconnecter de l’administration' : 'Connexion administrateur'} title={isAdminLoggedIn ? 'Se déconnecter' : 'Connexion administrateur'} className={`relative flex items-center justify-center shrink-0 transition-all focus:outline-none ${isAdminLoggedIn ? 'w-8 h-8 rounded-full border border-red-300/50 bg-black/25 text-red-200 hover:text-white hover:border-red-300/90 hover:bg-red-950/30' : 'w-10 h-10 rounded-md hover:scale-110'}`}>
            {isAdminLoggedIn ? <span className="text-[22px] leading-none font-light">×</span> : <><img src={adminSheep} alt="" aria-hidden="true" className="w-9 h-9 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]" /><span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#d4af37] border border-[#111612]" /></>}
          </button>
          <button id="mobile-menu-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="xl:hidden p-2 text-[#c4ceb8] hover:text-white" aria-label="Menu"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">{mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg></button>
        </div>
      </div>
      {mobileMenuOpen && <div id="mobile-nav-drawer" className="xl:hidden bg-[#181d19] border-b border-[#3b473e] px-4 pt-4 pb-6 space-y-3 animate-fadeIn"><div className="pb-3 border-b border-[#2a332d]">{logoPair}</div>{navLinks.map(link => <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-left py-2 text-sm uppercase tracking-widest text-[#e2d5c3] hover:text-[#d4af37] border-b border-[#2a332d]">{link.label}</button>)}<button onClick={openGite} className="block w-full text-left py-2 text-sm uppercase tracking-widest text-[#e2d5c3] hover:text-[#d4af37] border-b border-[#2a332d]">Gîte</button>{isAdminLoggedIn && <button onClick={openOrders} className="w-full text-center py-2.5 rounded-xl bg-[#28362b] text-[#d4af37] text-xs uppercase tracking-wider border border-[#d4af37]/70 font-semibold">Commandes</button>}</div>}
    </header>
  );
};
