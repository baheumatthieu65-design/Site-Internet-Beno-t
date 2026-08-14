import React, { useState, useEffect } from 'react';
import { initialBrandData } from './data/brandData';
import { BrandConfig, ButtonStyleId, SectionId, ProductBlockId } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { JacketsShowcase } from './components/JacketsShowcase';
import { JacketComparison } from './components/JacketComparison';
import { BrandStory } from './components/BrandStory';
import { LookbookGallery } from './components/LookbookGallery';
import { InquiryModal } from './components/InquiryModal';
import { BrandCustomizerModal } from './components/BrandCustomizerModal';
import { OrdersModal } from './components/OrdersModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminBar } from './components/AdminBar';
import { Footer } from './components/Footer';
import { verifyAdminSessionServer, logoutAdminServer, getStoredCredentials } from './utils/auth';
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
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>(() => getStoredCredentials().username);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  const [customizerTab, setCustomizerTab] = useState<'brand' | 'articles' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security' | 'github'>('theme');
  const [activeSection, setActiveSection] = useState('collection');

  // Verify server session on mount
  useEffect(() => {
    verifyAdminSessionServer().then((isAuth) => {
      setIsAdminLoggedIn(isAuth);
    });
  }, []);

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
    logoutAdminServer();
    setIsAdminLoggedIn(false);
    setIsCustomizerOpen(false);
    setIsOrdersOpen(false);
  };

  const handleOpenEditor = (tab: 'brand' | 'articles' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security' | 'github' = 'theme') => {
    if (isAdminLoggedIn) {
      setCustomizerTab(tab);
      setIsCustomizerOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleOpenOrders = () => {
    if (isAdminLoggedIn) {
      setIsOrdersOpen(true);
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

  // Drag and drop state for page sections
  const [isDragReorderMode, setIsDragReorderMode] = useState<boolean>(true);
  const [draggingSectionId, setDraggingSectionId] = useState<SectionId | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<SectionId | null>(null);
  const [reorderToast, setReorderToast] = useState<string | null>(null);

  const sectionMeta: Record<
    SectionId,
    { label: string; tab: 'brand' | 'articles' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security' }
  > = {
    hero: { label: '1. Accueil & Bannière Principale', tab: 'brand' },
    collection: { label: '2. Showcase Articles & Modèles', tab: 'articles' },
    comparatif: { label: '3. Tableau Comparatif des Vestes', tab: 'layouts' },
    origines: { label: '4. Récit & Terroir Pyrénéen', tab: 'brand' },
    lookbook: { label: '5. Galerie & Lookbook', tab: 'brand' },
    contact: { label: '6. Pied de page & Atelier', tab: 'brand' },
  };

  const handleSectionDragStart = (secId: SectionId, e: React.DragEvent) => {
    setDraggingSectionId(secId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', secId);
  };

  const handleSectionDragOver = (secId: SectionId, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSectionId !== secId) {
      setDragOverSectionId(secId);
    }
  };

  const handleSectionDrop = (targetSecId: SectionId) => {
    if (!draggingSectionId || draggingSectionId === targetSecId) {
      setDraggingSectionId(null);
      setDragOverSectionId(null);
      return;
    }

    const currentOrder = [...sectionOrder];
    const fromIndex = currentOrder.indexOf(draggingSectionId);
    const toIndex = currentOrder.indexOf(targetSecId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const updated = [...currentOrder];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      const newBrandData: BrandConfig = {
        ...brandData,
        theme: {
          ...(brandData.theme || defaultThemeConfig),
          sectionOrder: updated,
        },
      };
      handleSaveBrandData(newBrandData);
      setReorderToast(`Section « ${sectionMeta[draggingSectionId]?.label || draggingSectionId} » déplacée avec succès !`);
      setTimeout(() => setReorderToast(null), 3000);
    }

    setDraggingSectionId(null);
    setDragOverSectionId(null);
  };

  const handleMoveSectionDirect = (secId: SectionId, direction: 'up' | 'down') => {
    const currentOrder = [...sectionOrder];
    const index = currentOrder.indexOf(secId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const updated = [...currentOrder];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const newBrandData: BrandConfig = {
      ...brandData,
      theme: {
        ...(brandData.theme || defaultThemeConfig),
        sectionOrder: updated,
      },
    };
    handleSaveBrandData(newBrandData);
    setReorderToast(`Section déplacée avec succès !`);
    setTimeout(() => setReorderToast(null), 2500);
  };

  const handleReorderProductBlocks = (newOrder: ProductBlockId[]) => {
    const newBrandData: BrandConfig = {
      ...brandData,
      theme: {
        ...(brandData.theme || defaultThemeConfig),
        productBlocksOrder: newOrder,
      },
    };
    handleSaveBrandData(newBrandData);
    setReorderToast(`Disposition du bloc produit mise à jour !`);
    setTimeout(() => setReorderToast(null), 2500);
  };

  // Helper to render sections according to order
  const renderSection = (secId: SectionId, index: number) => {
    if (hiddenSections.includes(secId)) return null;

    let content: React.ReactNode = null;

    switch (secId) {
      case 'hero':
        content = (
          <HeroSection
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
        break;

      case 'collection':
        content = (
          <JacketsShowcase
            jackets={brandData.jackets}
            selectedJacketId={selectedJacketId}
            theme={theme}
            isAdminLoggedIn={isAdminLoggedIn}
            isDragReorderMode={isDragReorderMode}
            onOpenEditorSection={handleOpenEditor}
            onSelectJacket={setSelectedJacketId}
            onOpenInquiry={handleOpenInquiry}
            onReorderProductBlocks={handleReorderProductBlocks}
          />
        );
        break;

      case 'comparatif':
        content = (
          <JacketComparison
            jackets={brandData.jackets}
            theme={theme}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenEditorSection={handleOpenEditor}
            onSelectJacket={setSelectedJacketId}
            onOpenInquiry={handleOpenInquiry}
          />
        );
        break;

      case 'origines':
        content = (
          <BrandStory
            brandData={brandData}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenEditorSection={handleOpenEditor}
          />
        );
        break;

      case 'lookbook':
        content = (
          <LookbookGallery
            jackets={brandData.jackets}
            heroBgImage={brandData.heroBgImage}
            theme={theme}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenEditorSection={handleOpenEditor}
            onOpenInquiry={handleOpenInquiry}
          />
        );
        break;

      case 'contact':
        content = (
          <Footer
            brandData={brandData}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            onOpenCustomizer={handleOpenEditor}
            onOpenInquiry={() => handleOpenInquiry()}
          />
        );
        break;

      default:
        return null;
    }

    if (!isAdminLoggedIn || !isDragReorderMode) {
      return <div key={secId}>{content}</div>;
    }

    const isDragging = draggingSectionId === secId;
    const isDragOver = dragOverSectionId === secId;
    const meta = sectionMeta[secId] || { label: secId, tab: 'theme' };

    return (
      <div
        key={secId}
        draggable
        onDragStart={(e) => handleSectionDragStart(secId, e)}
        onDragOver={(e) => handleSectionDragOver(secId, e)}
        onDragLeave={() => setDragOverSectionId(null)}
        onDrop={() => handleSectionDrop(secId)}
        className={`relative transition-all ${
          isDragging ? 'opacity-30 scale-[0.99]' : 'opacity-100'
        } ${
          isDragOver
            ? 'border-4 border-dashed border-[#d4af37] bg-[#d4af37]/5 shadow-2xl'
            : ''
        }`}
      >
        {/* Floating Admin Section Drag Bar */}
        <div className="bg-[#121613] border-y border-[#d4af37]/40 px-4 py-2 flex items-center justify-between z-20 text-xs text-[#f3ece0] select-none">
          <div className="flex items-center space-x-2.5 cursor-grab active:cursor-grabbing text-[#d4af37]">
            <span className="p-1 rounded bg-[#212b23] border border-[#3b4b3e] text-[#d4af37] flex items-center justify-center">
              ⠿
            </span>
            <span className="font-serif font-bold text-sm text-[#f3ece0]">
              {meta.label}
            </span>
            <span className="text-[11px] text-[#a3b1a5] hidden sm:inline font-sans">
              (Cliquez & glissez cette barre pour déplacer la section)
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => handleMoveSectionDirect(secId, 'up')}
              disabled={index === 0}
              className="px-2 py-1 rounded bg-[#1e2720] hover:bg-[#28352b] border border-[#38483b] text-xs text-[#c4ceb8] disabled:opacity-30 cursor-pointer transition-all"
              title="Monter cette section"
            >
              ▲ Monter
            </button>
            <button
              type="button"
              onClick={() => handleMoveSectionDirect(secId, 'down')}
              disabled={index === sectionOrder.length - 1}
              className="px-2 py-1 rounded bg-[#1e2720] hover:bg-[#28352b] border border-[#38483b] text-xs text-[#c4ceb8] disabled:opacity-30 cursor-pointer transition-all"
              title="Descendre cette section"
            >
              ▼ Descendre
            </button>
            <button
              type="button"
              onClick={() => handleOpenEditor(meta.tab)}
              className="px-2.5 py-1 rounded bg-[#28362b] hover:bg-[#344638] border border-[#d4af37]/60 text-[#d4af37] text-xs font-semibold cursor-pointer transition-all"
              title="Éditer le contenu de cette section"
            >
              Éditer
            </button>
          </div>
        </div>

        {content}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121613] text-[#e2d5c3] font-sans selection:bg-[#d4af37] selection:text-[#121613] relative">
      {/* Toast notification on reorder */}
      {reorderToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#19221b] border border-[#d4af37] text-[#d4af37] text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-bounce">
          <span>✓</span>
          <span>{reorderToast}</span>
        </div>
      )}

      {/* Top Admin Sticky Bar when connected */}
      {isAdminLoggedIn && (
        <AdminBar
          username={adminUsername}
          theme={theme}
          isDragReorderMode={isDragReorderMode}
          onToggleDragReorderMode={() => setIsDragReorderMode(!isDragReorderMode)}
          onQuickChangeButtonStyle={handleQuickChangeButtonStyle}
          onOpenEditor={handleOpenEditor}
          onOpenOrders={handleOpenOrders}
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
        {sectionOrder.map((secId, index) => renderSection(secId, index))}
      </main>

      {/* Inquiry / Reservation Modal */}
      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        jackets={brandData.jackets}
        preselectedJacketId={inquiryJacketId}
        preselectedColor={inquiryColor}
        preselectedSize={inquirySize}
        ordersEmail={brandData.ordersEmail}
      />

      {/* Admin Login Dialog */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Standalone Orders & Reservations Reception Modal */}
      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        ordersEmail={brandData.ordersEmail}
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
