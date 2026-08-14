import React, { useState, useEffect } from 'react';
import { initialBrandData } from './data/brandData';
import { BrandConfig, ButtonStyleId, SectionId } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { JacketsShowcase } from './components/JacketsShowcase';
import { JacketComparison } from './components/JacketComparison';
import { BrandStory } from './components/BrandStory';
import { LookbookGallery } from './components/LookbookGallery';
import { InquiryModal } from './components/InquiryModal';
import { BrandCustomizerModal } from './components/BrandCustomizerModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminBar } from './components/AdminBar';
import { Footer } from './components/Footer';
import { getInitialAdminSession, setAdminSession, getStoredCredentials } from './utils/auth';
import { defaultThemeConfig } from './utils/themeStyles';

export default function App() {
  const [brandData, setBrandData] = useState<BrandConfig>(() => {
    const saved = localStorage.getItem('pyrenees_brand_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.theme) {
          parsed.theme = { ...defaultThemeConfig };
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved brand config:', e);
      }
    }
    return initialBrandData;
  });

  const [selectedJacketId, setSelectedJacketId] = useState<string>(
    brandData.jackets[0].id
  );

  // Inquiry Order Modal state
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryJacketId, setInquiryJacketId] = useState<string | undefined>(undefined);
  const [inquiryColor, setInquiryColor] = useState<string | undefined>(undefined);
  const [inquirySize, setInquirySize] = useState<string | undefined>(undefined);

  // Admin & Customizer states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => getInitialAdminSession());
  const [adminUsername, setAdminUsername] = useState<string>(() => getStoredCredentials().username);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [customizerTab, setCustomizerTab] = useState<'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security'>('theme');
  const [activeSection, setActiveSection] = useState('collection');

  // Save changes to localStorage
  const handleSaveBrandData = (newData: BrandConfig) => {
    setBrandData(newData);
    localStorage.setItem('pyrenees_brand_config', JSON.stringify(newData));
  };

  const handleResetBrandData = () => {
    setBrandData(initialBrandData);
    localStorage.removeItem('pyrenees_brand_config');
  };

  const handleQuickChangeButtonStyle = (styleId: ButtonStyleId) => {
    const updated: BrandConfig = {
      ...brandData,
      theme: {
        ...(brandData.theme || defaultThemeConfig),
        buttonStyle: styleId,
      },
    };
    handleSaveBrandData(updated);
  };

  const handleOpenInquiry = (jacketId?: string, color?: string, size?: string) => {
    setInquiryJacketId(jacketId || selectedJacketId);
    setInquiryColor(color);
    setInquirySize(size);
    setIsInquiryOpen(true);
  };

  const handleLoginSuccess = (user: string) => {
    setIsAdminLoggedIn(true);
    setAdminUsername(user);
    // Automatically open customizer on first successful login on the theme tab
    setCustomizerTab('theme');
    setIsCustomizerOpen(true);
  };

  const handleLogout = () => {
    setAdminSession(false);
    setIsAdminLoggedIn(false);
    setIsCustomizerOpen(false);
  };

  const handleOpenEditor = (tab: 'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security' = 'theme') => {
    if (isAdminLoggedIn) {
      setCustomizerTab(tab);
      setIsCustomizerOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleOpenSecurity = () => {
    if (isAdminLoggedIn) {
      setCustomizerTab('security');
      setIsCustomizerOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const theme = brandData.theme || defaultThemeConfig;
  const sectionOrder: SectionId[] = theme.sectionOrder || defaultThemeConfig.sectionOrder;
  const hiddenSections = theme.hiddenSections || [];

  // Helper to render sections according to order
  const renderSection = (secId: SectionId) => {
    if (hiddenSections.includes(secId)) return null;

    switch (secId) {
      case 'hero':
        return (
          <HeroSection
            key="hero"
            brandData={brandData}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenEditorSection={handleOpenEditor}
            onSelectJacket={(id) => {
              setSelectedJacketId(id);
              const el = document.getElementById('collection');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenInquiry={handleOpenInquiry}
          />
        );

      case 'collection':
        return (
          <JacketsShowcase
            key="collection"
            jackets={brandData.jackets}
            selectedJacketId={selectedJacketId}
            theme={theme}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenEditorSection={handleOpenEditor}
            onSelectJacket={setSelectedJacketId}
            onOpenInquiry={handleOpenInquiry}
          />
        );

      case 'comparatif':
        return (
          <JacketComparison
            key="comparatif"
            jackets={brandData.jackets}
            theme={theme}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenEditorSection={handleOpenEditor}
            onSelectJacket={setSelectedJacketId}
            onOpenInquiry={handleOpenInquiry}
          />
        );

      case 'origines':
        return (
          <BrandStory
            key="origines"
            brandData={brandData}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenEditorSection={handleOpenEditor}
          />
        );

      case 'lookbook':
        return (
          <LookbookGallery
            key="lookbook"
            jackets={brandData.jackets}
            heroBgImage={brandData.heroBgImage}
            theme={theme}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenEditorSection={handleOpenEditor}
            onOpenInquiry={handleOpenInquiry}
          />
        );

      case 'contact':
        return (
          <Footer
            key="contact"
            brandData={brandData}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            onOpenCustomizer={handleOpenEditor}
            onOpenInquiry={() => handleOpenInquiry()}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#121613] text-[#e2d5c3] font-sans selection:bg-[#d4af37] selection:text-[#121613]">
      {/* Top Admin Sticky Bar when connected */}
      {isAdminLoggedIn && (
        <AdminBar
          username={adminUsername}
          theme={theme}
          onQuickChangeButtonStyle={handleQuickChangeButtonStyle}
          onOpenEditor={handleOpenEditor}
          onOpenSecurity={handleOpenSecurity}
          onLogout={handleLogout}
        />
      )}

      {/* Sticky Header */}
      <Navbar
        brandData={brandData}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenLogin={() => setIsAdminLoginOpen(true)}
        onOpenCustomizer={handleOpenEditor}
        onOpenInquiry={handleOpenInquiry}
        activeSection={activeSection}
      />

      {/* Dynamic Ordered Sections */}
      <main>
        {sectionOrder.map((secId) => renderSection(secId))}
      </main>

      {/* Inquiry / Reservation Modal */}
      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        jackets={brandData.jackets}
        preselectedJacketId={inquiryJacketId}
        preselectedColor={inquiryColor}
        preselectedSize={inquirySize}
      />

      {/* Admin Login Dialog */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Brand & Content Customizer Modal for Admin */}
      <BrandCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        brandData={brandData}
        onSave={handleSaveBrandData}
        onReset={handleResetBrandData}
        initialTab={customizerTab}
      />
    </div>
  );
}
