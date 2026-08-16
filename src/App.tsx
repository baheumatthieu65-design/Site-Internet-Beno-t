import React, { useEffect, useState } from 'react';

import { initialBrandData } from './data/brandData';
import {
  BrandConfig,
  ButtonStyleId,
  ProductBlockId,
  SectionId,
} from './types';

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
import { AdminProductModal } from './components/AdminProductModal';
import { Footer } from './components/Footer';

import {
  verifyAdminSessionServer,
  logoutAdminServer,
  getStoredCredentials,
} from './utils/auth';

import { defaultThemeConfig } from './utils/themeStyles';

type CustomizerTab =
  | 'brand'
  | 'articles'
  | 'j1'
  | 'j2'
  | 'theme'
  | 'layouts'
  | 'labels'
  | 'security'
  | 'github';

export default function App() {
  // ===========================================================================
  // BRAND DATA
  // ===========================================================================

  const [brandData, setBrandData] = useState<BrandConfig>(() => {
    try {
      const saved = localStorage.getItem('pyrenees_brand_config');

      if (saved) {
        const parsed = JSON.parse(saved) as BrandConfig;

        return {
          ...initialBrandData,
          ...parsed,
          theme: {
            ...defaultThemeConfig,
            ...(parsed.theme || {}),
          },
        };
      }
    } catch (error) {
      console.error(
        'Erreur lors de la lecture de pyrenees_brand_config:',
        error
      );
    }

    return {
      ...initialBrandData,
      theme: {
        ...defaultThemeConfig,
        ...(initialBrandData.theme || {}),
      },
    };
  });

  // ===========================================================================
  // SELECTED PRODUCT
  // ===========================================================================

  const [selectedJacketId, setSelectedJacketId] = useState<string>(
    brandData.jackets?.[0]?.id || ''
  );

  // ===========================================================================
  // INQUIRY / ORDER MODAL
  // ===========================================================================

  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  const [inquiryJacketId, setInquiryJacketId] = useState<
    string | undefined
  >(undefined);

  const [inquiryColor, setInquiryColor] = useState<string | undefined>(
    undefined
  );

  const [inquirySize, setInquirySize] = useState<string | undefined>(
    undefined
  );

  // ===========================================================================
  // ADMIN STATE
  // ===========================================================================

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const [adminUsername, setAdminUsername] = useState<string>(() => {
    try {
      return getStoredCredentials().username || 'admin';
    } catch {
      return 'admin';
    }
  });

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  const [customizerTab, setCustomizerTab] =
    useState<CustomizerTab>('theme');

  const [activeSection, setActiveSection] = useState('collection');

  // ===========================================================================
  // SECTION DRAG / REORDER
  // ===========================================================================

  const [isDragReorderMode, setIsDragReorderMode] = useState(true);

  const [draggingSectionId, setDraggingSectionId] =
    useState<SectionId | null>(null);

  const [dragOverSectionId, setDragOverSectionId] =
    useState<SectionId | null>(null);

  const [reorderToast, setReorderToast] = useState<string | null>(null);

  // ===========================================================================
  // THEME
  // ===========================================================================

  const theme = {
    ...defaultThemeConfig,
    ...(brandData.theme || {}),
  };

  const sectionOrder: SectionId[] =
    theme.sectionOrder?.length > 0
      ? theme.sectionOrder
      : defaultThemeConfig.sectionOrder;

  const hiddenSections: SectionId[] = theme.hiddenSections || [];

  // ===========================================================================
  // SAVE BRAND DATA
  // ===========================================================================

  const handleSaveBrandData = (newData: BrandConfig) => {
    const normalizedData: BrandConfig = {
      ...newData,
      theme: {
        ...defaultThemeConfig,
        ...(newData.theme || {}),
      },
    };

    setBrandData(normalizedData);

    try {
      localStorage.setItem(
        'pyrenees_brand_config',
        JSON.stringify(normalizedData)
      );
    } catch (error) {
      console.error(
        'Impossible de sauvegarder la configuration locale:',
        error
      );
    }
  };

  // ===========================================================================
  // RESET BRAND DATA
  // ===========================================================================

  const handleResetBrandData = () => {
    const resetData: BrandConfig = {
      ...initialBrandData,
      theme: {
        ...defaultThemeConfig,
        ...(initialBrandData.theme || {}),
      },
    };

    setBrandData(resetData);

    setSelectedJacketId(resetData.jackets?.[0]?.id || '');

    try {
      localStorage.removeItem('pyrenees_brand_config');
    } catch (error) {
      console.error(
        'Impossible de supprimer la configuration locale:',
        error
      );
    }
  };

  // ===========================================================================
  // LOAD PRODUCTS FROM SERVER
  // ===========================================================================

  const fetchServerProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(
          `Impossible de charger les produits serveur. HTTP ${response.status}. Conservation des produits locaux.`
        );

        return;
      }

      const data = await response.json();

      if (
        !data ||
        data.success !== true ||
        !Array.isArray(data.products)
      ) {
        console.warn(
          'Réponse produits serveur invalide. Conservation des produits locaux.'
        );

        return;
      }

      const products = data.products;

      // IMPORTANT :
      // Si l'API retourne un tableau vide, on conserve
      // les produits présents dans initialBrandData.
      //
      // Cela évite que le site devienne vide/blanc lorsque
      // Redis n'est pas encore initialisé.
      if (products.length === 0) {
        console.warn(
          'API produits vide : conservation des produits locaux.'
        );

        return;
      }

      setBrandData((previous) => ({
        ...previous,
        jackets: products,
      }));

      setSelectedJacketId((currentId) => {
        if (
          currentId &&
          products.some(
            (product: { id?: string }) =>
              product.id === currentId
          )
        ) {
          return currentId;
        }

        return products[0]?.id || '';
      });
    } catch (error) {
      console.warn(
        'Impossible de récupérer les produits depuis le serveur. Utilisation des données locales.',
        error
      );
    }
  };

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const isAuthenticated =
          await verifyAdminSessionServer();

        setIsAdminLoggedIn(isAuthenticated);
      } catch (error) {
        console.warn(
          'Impossible de vérifier la session administrateur:',
          error
        );

        setIsAdminLoggedIn(false);
      }

      await fetchServerProducts();
    };

    void initializeApp();
  }, []);

  // ===========================================================================
  // BUTTON STYLE
  // ===========================================================================

  const handleQuickChangeButtonStyle = (
    styleId: ButtonStyleId
  ) => {
    const updatedData: BrandConfig = {
      ...brandData,
      theme: {
        ...theme,
        buttonStyle: styleId,
      },
    };

    handleSaveBrandData(updatedData);
  };

  // ===========================================================================
  // OPEN INQUIRY
  // ===========================================================================

  const handleOpenInquiry = (
    jacketId?: string,
    color?: string,
    size?: string
  ) => {
    setInquiryJacketId(
      jacketId ||
        selectedJacketId ||
        brandData.jackets?.[0]?.id
    );

    setInquiryColor(color);
    setInquirySize(size);

    setIsInquiryOpen(true);
  };

  // ===========================================================================
  // ADMIN LOGIN
  // ===========================================================================

  const handleLoginSuccess = (user: string) => {
    setIsAdminLoggedIn(true);
    setAdminUsername(user || 'admin');

    setCustomizerTab('theme');
    setIsCustomizerOpen(true);
    setIsAdminLoginOpen(false);
  };

  // ===========================================================================
  // ADMIN LOGOUT
  // ===========================================================================

  const handleLogout = async () => {
    try {
      await logoutAdminServer();
    } catch (error) {
      console.warn(
        'Erreur lors de la déconnexion administrateur:',
        error
      );
    }

    setIsAdminLoggedIn(false);
    setIsCustomizerOpen(false);
    setIsOrdersOpen(false);
    setIsProductsOpen(false);
  };

  // ===========================================================================
  // OPEN EDITOR
  // ===========================================================================

  const handleOpenEditor = (
    tab: CustomizerTab = 'theme'
  ) => {
    if (isAdminLoggedIn) {
      setCustomizerTab(tab);
      setIsCustomizerOpen(true);
      return;
    }

    setIsAdminLoginOpen(true);
  };

  // ===========================================================================
  // OPEN ORDERS
  // ===========================================================================

  const handleOpenOrders = () => {
    if (isAdminLoggedIn) {
      setIsOrdersOpen(true);
      return;
    }

    setIsAdminLoginOpen(true);
  };

  // ===========================================================================
  // OPEN SECURITY
  // ===========================================================================

  const handleOpenSecurity = () => {
    if (isAdminLoggedIn) {
      setCustomizerTab('security');
      setIsCustomizerOpen(true);
      return;
    }

    setIsAdminLoginOpen(true);
  };

  // ===========================================================================
  // SECTION METADATA
  // ===========================================================================

  const sectionMeta: Record<
    SectionId,
    {
      label: string;
      tab:
        | 'brand'
        | 'articles'
        | 'j1'
        | 'j2'
        | 'theme'
        | 'layouts'
        | 'labels'
        | 'security';
    }
  > = {
    hero: {
      label: '1. Accueil & Bannière Principale',
      tab: 'brand',
    },

    collection: {
      label: '2. Showcase Articles & Modèles',
      tab: 'articles',
    },

    comparatif: {
      label: '3. Tableau Comparatif des Vestes',
      tab: 'layouts',
    },

    origines: {
      label: '4. Récit & Terroir Pyrénéen',
      tab: 'brand',
    },

    lookbook: {
      label: '5. Galerie & Lookbook',
      tab: 'brand',
    },

    contact: {
      label: '6. Pied de page & Atelier',
      tab: 'brand',
    },
  };

  // ===========================================================================
  // DRAG START
  // ===========================================================================

  const handleSectionDragStart = (
    sectionId: SectionId,
    event: React.DragEvent<HTMLDivElement>
  ) => {
    setDraggingSectionId(sectionId);

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'text/plain',
      sectionId
    );
  };

  // ===========================================================================
  // DRAG OVER
  // ===========================================================================

  const handleSectionDragOver = (
    sectionId: SectionId,
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    event.dataTransfer.dropEffect = 'move';

    if (dragOverSectionId !== sectionId) {
      setDragOverSectionId(sectionId);
    }
  };

  // ===========================================================================
  // DROP
  // ===========================================================================

  const handleSectionDrop = (
    targetSectionId: SectionId
  ) => {
    if (
      !draggingSectionId ||
      draggingSectionId === targetSectionId
    ) {
      setDraggingSectionId(null);
      setDragOverSectionId(null);

      return;
    }

    const currentOrder = [...sectionOrder];

    const fromIndex =
      currentOrder.indexOf(
        draggingSectionId
      );

    const toIndex =
      currentOrder.indexOf(
        targetSectionId
      );

    if (
      fromIndex === -1 ||
      toIndex === -1
    ) {
      setDraggingSectionId(null);
      setDragOverSectionId(null);

      return;
    }

    const updatedOrder = [
      ...currentOrder,
    ];

    const [movedSection] =
      updatedOrder.splice(
        fromIndex,
        1
      );

    updatedOrder.splice(
      toIndex,
      0,
      movedSection
    );

    const updatedBrandData: BrandConfig = {
      ...brandData,
      theme: {
        ...theme,
        sectionOrder: updatedOrder,
      },
    };

    handleSaveBrandData(
      updatedBrandData
    );

    const movedLabel =
      sectionMeta[
        draggingSectionId
      ]?.label ||
      draggingSectionId;

    setReorderToast(
      `Section « ${movedLabel} » déplacée avec succès !`
    );

    window.setTimeout(() => {
      setReorderToast(null);
    }, 3000);

    setDraggingSectionId(null);
    setDragOverSectionId(null);
  };

  // ===========================================================================
  // MOVE SECTION UP / DOWN
  // ===========================================================================

  const handleMoveSectionDirect = (
    sectionId: SectionId,
    direction: 'up' | 'down'
  ) => {
    const currentOrder = [
      ...sectionOrder,
    ];

    const index =
      currentOrder.indexOf(
        sectionId
      );

    if (index === -1) {
      return;
    }

    const targetIndex =
      direction === 'up'
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >=
        currentOrder.length
    ) {
      return;
    }

    const updatedOrder = [
      ...currentOrder,
    ];

    const [movedSection] =
      updatedOrder.splice(
        index,
        1
      );

    updatedOrder.splice(
      targetIndex,
      0,
      movedSection
    );

    const updatedBrandData: BrandConfig = {
      ...brandData,
      theme: {
        ...theme,
        sectionOrder: updatedOrder,
      },
    };

    handleSaveBrandData(
      updatedBrandData
    );

    setReorderToast(
      direction === 'up'
        ? 'Section montée avec succès !'
        : 'Section descendue avec succès !'
    );

    window.setTimeout(() => {
      setReorderToast(null);
    }, 2500);
  };

  // ===========================================================================
  // PRODUCT BLOCK REORDER
  // ===========================================================================

  const handleReorderProductBlocks = (
    newOrder: ProductBlockId[]
  ) => {
    const updatedBrandData: BrandConfig = {
      ...brandData,
      theme: {
        ...theme,
        productBlocksOrder:
          newOrder,
      },
    };

    handleSaveBrandData(
      updatedBrandData
    );

    setReorderToast(
      'Disposition du bloc produit mise à jour !'
    );

    window.setTimeout(() => {
      setReorderToast(null);
    }, 2500);
  };

  // ===========================================================================
  // RENDER SECTION
  // ===========================================================================

  const renderSection = (
    sectionId: SectionId,
    index: number
  ) => {
    if (
      hiddenSections.includes(
        sectionId
      )
    ) {
      return null;
    }

    let content: React.ReactNode = null;

    switch (sectionId) {
      case 'hero':
        content = (
          <HeroSection
            brandData={brandData}
            isAdminLoggedIn={
              isAdminLoggedIn
            }
            onOpenEditorSection={
              handleOpenEditor
            }
            onSelectJacket={(id) => {
              setSelectedJacketId(id);

              window.setTimeout(() => {
                const element =
                  document.getElementById(
                    'collection'
                  );

                element?.scrollIntoView({
                  behavior: 'smooth',
                });
              }, 0);
            }}
            onOpenInquiry={
              handleOpenInquiry
            }
          />
        );
        break;

      case 'collection':
        content = (
          <JacketsShowcase
            jackets={
              brandData.jackets
            }
            selectedJacketId={
              selectedJacketId
            }
            theme={theme}
            isAdminLoggedIn={
              isAdminLoggedIn
            }
            isDragReorderMode={
              isDragReorderMode
            }
            onOpenEditorSection={
              handleOpenEditor
            }
            onSelectJacket={
              setSelectedJacketId
            }
            onOpenInquiry={
              handleOpenInquiry
            }
            onReorderProductBlocks={
              handleReorderProductBlocks
            }
          />
        );
        break;

      case 'comparatif':
        content = (
          <JacketComparison
            jackets={
              brandData.jackets
            }
            theme={theme}
            isAdminLoggedIn={
              isAdminLoggedIn
            }
            onOpenEditorSection={
              handleOpenEditor
            }
            onSelectJacket={
              setSelectedJacketId
            }
            onOpenInquiry={
              handleOpenInquiry
            }
          />
        );
        break;

      case 'origines':
        content = (
          <BrandStory
            brandData={brandData}
            isAdminLoggedIn={
              isAdminLoggedIn
            }
            onOpenEditorSection={
              handleOpenEditor
            }
          />
        );
        break;

      case 'lookbook':
        content = (
          <LookbookGallery
            jackets={
              brandData.jackets
            }
            heroBgImage={
              brandData.heroBgImage
            }
            theme={theme}
            isAdminLoggedIn={
              isAdminLoggedIn
            }
            onOpenEditorSection={
              handleOpenEditor
            }
            onOpenInquiry={
              handleOpenInquiry
            }
          />
        );
        break;

      case 'contact':
        content = (
          <Footer
            brandData={brandData}
            isAdminLoggedIn={
              isAdminLoggedIn
            }
            onOpenLogin={() =>
              setIsAdminLoginOpen(
                true
              )
            }
            onOpenCustomizer={
              handleOpenEditor
            }
            onOpenInquiry={() =>
              handleOpenInquiry()
            }
          />
        );
        break;

      default:
        return null;
    }

    // =========================================================================
    // NORMAL VISITOR MODE
    // =========================================================================

    if (
      !isAdminLoggedIn ||
      !isDragReorderMode
    ) {
      return (
        <div key={sectionId}>
          {content}
        </div>
      );
    }

    // =========================================================================
    // ADMIN DRAG MODE
    // =========================================================================

    const isDragging =
      draggingSectionId ===
      sectionId;

    const isDragOver =
      dragOverSectionId ===
      sectionId;

    const meta =
      sectionMeta[
        sectionId
      ];

    return (
      <div
        key={sectionId}
        draggable
        onDragStart={(event) =>
          handleSectionDragStart(
            sectionId,
            event
          )
        }
        onDragOver={(event) =>
          handleSectionDragOver(
            sectionId,
            event
          )
        }
        onDragLeave={() =>
          setDragOverSectionId(
            null
          )
        }
        onDrop={() =>
          handleSectionDrop(
            sectionId
          )
        }
        className={`relative transition-all ${
          isDragging
            ? 'opacity-30 scale-[0.99]'
            : 'opacity-100'
        } ${
          isDragOver
            ? 'border-4 border-dashed border-[#d4af37] bg-[#d4af37]/5 shadow-2xl'
            : ''
        }`}
      >
        <div className="bg-[#121613] border-y border-[#d4af37]/40 px-4 py-2 flex items-center justify-between z-20 text-xs text-[#f3ece0] select-none">
          <div className="flex items-center space-x-2.5 cursor-grab active:cursor-grabbing text-[#d4af37]">
            <span className="p-1 rounded bg-[#212b23] border border-[#3b4b3e] text-[#d4af37] flex items-center justify-center">
              ⠿
            </span>

            <span className="font-serif font-bold text-sm text-[#f3ece0]">
              {meta?.label ||
                sectionId}
            </span>

            <span className="text-[11px] text-[#a3b1a5] hidden sm:inline font-sans">
              Cliquez et glissez pour déplacer
              la section
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                handleMoveSectionDirect(
                  sectionId,
                  'up'
                );
              }}
              disabled={index === 0}
              className="px-2 py-1 rounded bg-[#1e2720] hover:bg-[#28352b] border border-[#38483b] text-xs text-[#c4ceb8] disabled:opacity-30 cursor-pointer transition-all"
              title="Monter cette section"
            >
              ▲ Monter
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                handleMoveSectionDirect(
                  sectionId,
                  'down'
                );
              }}
              disabled={
                index ===
                sectionOrder.length - 1
              }
              className="px-2 py-1 rounded bg-[#1e2720] hover:bg-[#28352b] border border-[#38483b] text-xs text-[#c4ceb8] disabled:opacity-30 cursor-pointer transition-all"
              title="Descendre cette section"
            >
              ▼ Descendre
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                handleOpenEditor(
                  meta?.tab ||
                    'theme'
                );
              }}
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

  // ===========================================================================
  // RENDER APP
  // ===========================================================================

  return (
    <div className="min-h-screen bg-[#121613] text-[#e2d5c3] font-sans selection:bg-[#d4af37] selection:text-[#121613] relative">
      {reorderToast && (
        <div className="fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl bg-[#19221b] border border-[#d4af37] text-[#d4af37] text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-bounce">
          <span>✓</span>

          <span>
            {reorderToast}
          </span>
        </div>
      )}

      {isAdminLoggedIn && (
        <AdminBar
          username={adminUsername}
          theme={theme}
          isDragReorderMode={
            isDragReorderMode
          }
          onToggleDragReorderMode={() =>
            setIsDragReorderMode(
              (current) => !current
            )
          }
          onQuickChangeButtonStyle={
            handleQuickChangeButtonStyle
          }
          onOpenEditor={
            handleOpenEditor
          }
          onOpenOrders={
            handleOpenOrders
          }
          onOpenProducts={() =>
            setIsProductsOpen(true)
          }
          onOpenSecurity={
            handleOpenSecurity
          }
          onLogout={
            handleLogout
          }
        />
      )}

      <Navbar
        brandData={brandData}
        isAdminLoggedIn={
          isAdminLoggedIn
        }
        onOpenLogin={() =>
          setIsAdminLoginOpen(true)
        }
        onOpenCustomizer={
          handleOpenEditor
        }
        onOpenInquiry={
          handleOpenInquiry
        }
        activeSection={
          activeSection
        }
      />

      <main>
        {sectionOrder.map(
          (
            sectionId,
            index
          ) =>
            renderSection(
              sectionId,
              index
            )
        )}
      </main>

      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() =>
          setIsInquiryOpen(false)
        }
        jackets={
          brandData.jackets
        }
        preselectedJacketId={
          inquiryJacketId
        }
        preselectedColor={
          inquiryColor
        }
        preselectedSize={
          inquirySize
        }
        ordersEmail={
          brandData.ordersEmail
        }
      />

      <AdminLoginModal
        isOpen={
          isAdminLoginOpen
        }
        onClose={() =>
          setIsAdminLoginOpen(
            false
          )
        }
        onLoginSuccess={
          handleLoginSuccess
        }
      />

      <OrdersModal
        isOpen={
          isOrdersOpen
        }
        onClose={() =>
          setIsOrdersOpen(false)
        }
        ordersEmail={
          brandData.ordersEmail
        }
      />

      <AdminProductModal
        isOpen={
          isProductsOpen
        }
        onClose={() =>
          setIsProductsOpen(false)
        }
        products={
          brandData.jackets
        }
        onRefreshProducts={
          fetchServerProducts
        }
      />

      <BrandCustomizerModal
        isOpen={
          isCustomizerOpen
        }
        onClose={() =>
          setIsCustomizerOpen(false)
        }
        brandData={
          brandData
        }
        onSave={
          handleSaveBrandData
        }
        onReset={
          handleResetBrandData
        }
        initialTab={
          customizerTab
        }
      />
    </div>
  );
}
