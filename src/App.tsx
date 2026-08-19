import React, { useEffect, useRef, useState } from 'react';

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
  SiteVisualEditor,
  SiteEditorConfig,
} from './components/SiteVisualEditor';
import { SiteBlocksRenderer } from './components/SiteBlocksRenderer';
import GitePage from './components/GitePage';
import { LogoEditorModal } from './components/LogoEditorModal';
import './styles/gite-v48.css';

import {
  verifyAdminSessionServer,
  logoutAdminServer,
  getStoredCredentials,
} from './utils/auth';

import { defaultThemeConfig } from './utils/themeStyles';
import {
  getInitialBrandData,
  getInitialEditorConfig,
} from './lib/publishedSite';

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
    /*
     * PREMIER RENDU SANS FLASH
     *
     * La version publiée dans GitHub/Vercel est la source de vérité
     * au premier rendu.
     *
     * IMPORTANT :
     * On ne recharge plus ici l'ancien localStorage par-dessus la
     * version publiée. C'était ce qui pouvait afficher brièvement
     * l'ancien texte avant le chargement de la nouvelle configuration.
     */
    const publishedData = getInitialBrandData(initialBrandData);

    return {
      ...publishedData,
      theme: {
        ...defaultThemeConfig,
        ...(publishedData.theme || {}),
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
  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);

  // Toutes les publications administrateur passent par une file unique.
  // Une action rapide ne peut donc plus écraser une action plus récente
  // avec une requête réseau terminée dans le mauvais ordre.
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const [siteEditorConfig, setSiteEditorConfig] =
    useState<SiteEditorConfig>(() =>
      getInitialEditorConfig<SiteEditorConfig>({
        adminBarPosition: 'bottom',
        blocks: [],
      })
    );

  // Le contenu publié serveur est la source commune aux visiteurs et à l'admin.
  // On ne révèle l'application qu'après la première synchronisation (ou fallback).
  const [publishedConfigReady, setPublishedConfigReady] = useState(false);




  const [customizerTab, setCustomizerTab] =
    useState<CustomizerTab>('theme');

  const [activeSection, setActiveSection] = useState('collection');
  const [isGitePageOpen, setIsGitePageOpen] = useState(false);

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


    // Publication serveur + GitHub pour éviter que les changements
    // du Customizer ou du réordonnancement reviennent en arrière.
    void saveSiteConfig(normalizedData, siteEditorConfig).then((result) => {
      if (!result.success) {
        setReorderToast(
          `Erreur de publication : ${result.error}`
        );

        window.setTimeout(() => {
          setReorderToast(null);
        }, 5000);
      }
    });
  };

  // ===========================================================================
  // SAVE VISUAL EDITOR CONFIGURATION TO UPSTASH
  // ===========================================================================

  const saveSiteConfig = (
    nextBrandData: BrandConfig = brandData,
    nextEditorConfig: SiteEditorConfig = siteEditorConfig
  ) => {
    const operation = saveQueueRef.current.then(async () => {
      const normalizedBrandData: BrandConfig = {
        ...nextBrandData,
        theme: {
          ...defaultThemeConfig,
          ...(nextBrandData.theme || {}),
        },
      };

      // Un snapshot et une révision uniques pour les deux stockages.
      const publishedAt = Date.now();
      const config = {
        brandData: normalizedBrandData,
        editorConfig: nextEditorConfig,
        publishedAt,
      };

      try {
        // 1) Upstash est la source runtime. On l'écrit EN PREMIER afin que
        // visiteurs et admin voient le même snapshot dès l'enregistrement.
        const response = await fetch('/api/site-config', {
          method: 'PUT',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({ config }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(
            errorBody?.error ||
              `Synchronisation configuration: HTTP ${response.status}`
          );
        }

        // 2) Même snapshot vers GitHub pour que le prochain bundle Vercel
        // contienne exactement la même configuration de secours.
        const publishResponse = await fetch('/api/site-publish', {
          method: 'PUT',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({ config }),
        });

        if (!publishResponse.ok) {
          const publishBody = await publishResponse.json().catch(() => null);
          throw new Error(
            publishBody?.error ||
              `Publication GitHub: HTTP ${publishResponse.status}`
          );
        }

        // L'état local suit exactement le snapshot qui vient d'être publié.
        setBrandData(normalizedBrandData);
        setSiteEditorConfig(nextEditorConfig);
        setPublishedConfigReady(true);

        return {
          success: true,
          commitSha: (await publishResponse.json().catch(() => null))?.commitSha || null,
        };
      } catch (error) {
        console.error(
          'Impossible de sauvegarder/publicer la configuration du site:',
          error
        );

        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Erreur inconnue pendant la publication.',
        };
      }
    });

    saveQueueRef.current = operation.then(() => undefined, () => undefined);
    return operation;
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

    void saveSiteConfig(resetData, siteEditorConfig);
  };

  // ===========================================================================
  // LOAD PUBLISHED SITE CONFIG FROM SERVER
  // ===========================================================================

  const fetchPublishedSiteConfig = async (): Promise<boolean> => {
    try {
      const response = await fetch(`/api/site-config?ts=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0',
        },
      });

      if (!response.ok) {
        console.warn(`Configuration publiée indisponible. HTTP ${response.status}. Fallback bundle utilisé.`);
        return false;
      }

      const data = await response.json();
      const config = data?.config;

      if (!config || typeof config !== 'object') {
        return false;
      }

      if (config.brandData && typeof config.brandData === 'object') {
        setBrandData((previous) => {
          const serverBrandData = config.brandData as Partial<BrandConfig>;
          return {
            ...previous,
            ...serverBrandData,
            theme: {
              ...defaultThemeConfig,
              ...(previous.theme || {}),
              ...(serverBrandData.theme || {}),
            },
          };
        });

        setSelectedJacketId((currentId) => {
          const jackets = Array.isArray(config.brandData.jackets)
            ? config.brandData.jackets
            : [];
          if (currentId && jackets.some((product: { id?: string }) => product.id === currentId)) {
            return currentId;
          }
          return jackets[0]?.id || currentId;
        });
      }

      if (config.editorConfig && typeof config.editorConfig === 'object') {
        setSiteEditorConfig(config.editorConfig as SiteEditorConfig);
      }

      return true;
    } catch (error) {
      console.warn('Impossible de récupérer la configuration publiée. Fallback bundle utilisé.', error);
      return false;
    }
  };

  // ===========================================================================
  // LOAD PRODUCTS FROM SERVER
  // ===========================================================================

  const fetchServerProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
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
      // V2.2 : les trois lectures indépendantes démarrent ensemble.
      // On conserve exactement les mêmes fonctions de chargement qu'avant.
      const publishedPromise = fetchPublishedSiteConfig();
      const productsPromise = fetchServerProducts();
      const authPromise = verifyAdminSessionServer();

      try {
        const [loaded] = await Promise.all([
          publishedPromise,
          productsPromise,
        ]);

        setPublishedConfigReady(true);
        window.dispatchEvent(
          new CustomEvent('site-bootstrap-ready', {
            detail: { published: loaded },
          })
        );
      } catch (error) {
        console.warn('Initialisation du site:', error);
        setPublishedConfigReady(true);
        window.dispatchEvent(new CustomEvent('site-bootstrap-ready'));
      }

      try {
        const isAuthenticated = await authPromise;
        setIsAdminLoggedIn(isAuthenticated);
      } catch (error) {
        console.warn(
          'Impossible de vérifier la session administrateur:',
          error
        );
        setIsAdminLoggedIn(false);
      }
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
    setAdminUsername(user || 'admin');
    // Relecture forcée après connexion : l'espace admin ne doit jamais
    // conserver un snapshot différent de celui présenté au visiteur.
    void fetchPublishedSiteConfig().finally(() => {
      setIsAdminLoggedIn(true);
      setIsAdminLoginOpen(false);
      setIsCustomizerOpen(false);
    });
  };

  // ===========================================================================
  // ADMIN LOGOUT
  // ===========================================================================

  const handleLogout = async () => {
    // V2.2 : ne jamais quitter l'admin pendant qu'une sauvegarde est encore
    // en cours. Sinon le refresh peut récupérer la version précédente.
    try {
      await saveQueueRef.current;
      await fetchPublishedSiteConfig();
      await fetchServerProducts();
    } catch (error) {
      console.warn(
        'Impossible de resynchroniser la configuration publiée avant le logout:',
        error
      );
    }

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
    setIsAdminBarVisible(false);
  };

  // ===========================================================================
  // SAVE VISUAL EDITOR
  // ===========================================================================

  const handleSaveVisualEditor = async (
    nextEditorConfig: SiteEditorConfig = siteEditorConfig
  ) => {
    const result = await saveSiteConfig(
      brandData,
      nextEditorConfig
    );

    if (result.success) {
      setSiteEditorConfig(nextEditorConfig);
      setReorderToast(
        result.commitSha
          ? '✓ Enregistré + publié sur GitHub. Vercel va redéployer le site.'
          : '✓ Configuration enregistrée.'
      );

      window.setTimeout(() => {
        setReorderToast(null);
      }, 5000);
    } else {
      setReorderToast(
        `Erreur : ${result.error}`
      );

      window.setTimeout(() => {
        setReorderToast(null);
      }, 6000);
    }
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

  const handleOpenGite = () => {
    setIsGitePageOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToVitrine = () => {
    setIsGitePageOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      <SiteBlocksRenderer config={siteEditorConfig} />

      {isAdminLoggedIn && (
        <SiteVisualEditor
          brandData={brandData}
          config={siteEditorConfig}
          onChange={setSiteEditorConfig}
          onSave={async (nextConfig) => {
            await handleSaveVisualEditor(nextConfig);
          }}
          onOpenCustomizer={() => handleOpenEditor('theme')}
          adminToolbar={
            <AdminBar
              embedded
              username={adminUsername}
              theme={theme}
              isDragReorderMode={isDragReorderMode}
              onToggleDragReorderMode={() =>
                setIsDragReorderMode((current) => !current)
              }
              onQuickChangeButtonStyle={handleQuickChangeButtonStyle}
              onOpenEditor={handleOpenEditor}
              onOpenOrders={handleOpenOrders}
              onOpenProducts={() => setIsProductsOpen(true)}
              onOpenLogoEditor={() => setIsLogoEditorOpen(true)}
              onOpenSecurity={handleOpenSecurity}
              onLogout={handleLogout}
            />
          }
        />
      )}

      {!isGitePageOpen && (
        <>
          <Navbar
            brandData={brandData}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            onLogout={handleLogout}
            onOpenCustomizer={handleOpenEditor}
            onOpenInquiry={handleOpenInquiry}
            activeSection={activeSection}
            onOpenGite={handleOpenGite}
          />
          <main>
            {sectionOrder.map((sectionId, index) => renderSection(sectionId, index))}
          </main>
        </>
      )}

      {isGitePageOpen && (
        <GitePage
          brandData={brandData}
          onBackToVitrine={handleBackToVitrine}
          onAdmin={() => handleOpenEditor('theme')}
        />
      )}

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

      <LogoEditorModal
        isOpen={isLogoEditorOpen}
        brandData={brandData}
        onClose={() => setIsLogoEditorOpen(false)}
        onSave={handleSaveBrandData}
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