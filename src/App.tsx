import React, { useState, useEffect } from 'react';
import { initialBrandData } from './data/brandData';
import { BrandConfig } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { JacketsShowcase } from './components/JacketsShowcase';
import { JacketComparison } from './components/JacketComparison';
import { BrandStory } from './components/BrandStory';
import { LookbookGallery } from './components/LookbookGallery';
import { InquiryModal } from './components/InquiryModal';
import { BrandCustomizerModal } from './components/BrandCustomizerModal';
import { Footer } from './components/Footer';

export default function App() {
  const [brandData, setBrandData] = useState<BrandConfig>(() => {
    const saved = localStorage.getItem('pyrenees_brand_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved brand config:', e);
      }
    }
    return initialBrandData;
  });

  const [selectedJacketId, setSelectedJacketId] = useState<string>(
    brandData.jackets[0].id
  );

  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryJacketId, setInquiryJacketId] = useState<string | undefined>(undefined);
  const [inquiryColor, setInquiryColor] = useState<string | undefined>(undefined);
  const [inquirySize, setInquirySize] = useState<string | undefined>(undefined);

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
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

  const handleOpenInquiry = (jacketId?: string, color?: string, size?: string) => {
    setInquiryJacketId(jacketId || selectedJacketId);
    setInquiryColor(color);
    setInquirySize(size);
    setIsInquiryOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#121613] text-[#e2d5c3] font-sans selection:bg-[#d4af37] selection:text-[#121613]">
      {/* Sticky Header */}
      <Navbar
        brandData={brandData}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenInquiry={handleOpenInquiry}
        activeSection={activeSection}
      />

      {/* Hero Section */}
      <HeroSection
        brandData={brandData}
        onSelectJacket={(id) => {
          setSelectedJacketId(id);
          const el = document.getElementById('collection');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenInquiry={handleOpenInquiry}
      />

      {/* Main Jackets Showcase */}
      <JacketsShowcase
        jackets={brandData.jackets}
        selectedJacketId={selectedJacketId}
        onSelectJacket={setSelectedJacketId}
        onOpenInquiry={handleOpenInquiry}
      />

      {/* Model Comparison Table */}
      <JacketComparison
        jackets={brandData.jackets}
        onSelectJacket={setSelectedJacketId}
        onOpenInquiry={handleOpenInquiry}
      />

      {/* Brand Story & Pyrenees Terroir */}
      <BrandStory brandData={brandData} />

      {/* Lookbook Editorial Gallery */}
      <LookbookGallery
        jackets={brandData.jackets}
        heroBgImage={brandData.heroBgImage}
        onOpenInquiry={handleOpenInquiry}
      />

      {/* Footer */}
      <Footer
        brandData={brandData}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenInquiry={() => handleOpenInquiry()}
      />

      {/* Modals */}
      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        jackets={brandData.jackets}
        preselectedJacketId={inquiryJacketId}
        preselectedColor={inquiryColor}
        preselectedSize={inquirySize}
      />

      <BrandCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        brandData={brandData}
        onSave={handleSaveBrandData}
        onReset={handleResetBrandData}
      />
    </div>
  );
}
