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
import { Footer } from './components/Footer';
import {
  SiteVisualEditor,
  SiteEditorConfig,
} from './components/SiteVisualEditor';
import { SiteBlocksRenderer } from './components/SiteBlocksRenderer';
import GitePage from './components/GitePage';
import { LogoEditorModal } from './components/LogoEditorModal';
import { FloatingMediaLayer } from './components/FloatingMediaLayer';
import './styles/gite-v48.css';
import './styles/floating-media.css';

import {
  verifyAdminSessionServer,
  logoutAdminServer,
  getStoredCredentials,
} from './utils/auth';

import { defaultThemeConfig } from './utils/themeStyles';
import { normalizeProductAvailability } from './utils/productStatus';
import {
  cachePublishedSiteConfig,
  getInitialBrandData,
  getInitialEditorConfig,
  hasLocalPublishedSiteConfig,
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
  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);
  const [isFloatingMediaOpen, setIsFloatingMediaOpen] = useState(false);

  // Toutes les publications administrateur passent par une file unique.
  // Une action rapide ne peut donc plus écraser une action plus récente
  // avec une requête réseau terminée dans le mauvais ordre.
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  // V2.4 : snapshot exact de l'état affiché au moment où l'admin entre.
  // Ce snapshot est remplacé uniquement après une sauvegarde réussie.
  // Il permet de sortir de l'admin sans qu'une requête asynchrone tardive
  // ou un rendu admin puisse faire apparaître une autre version.
  const adminSessionSnapshotRef = useRef<{
    brandData: BrandConfig;
    editorConfig: SiteEditorConfig;
  } | null>(null);

  const [siteEditorConfig, setSiteEditorConfig] =
    useState<SiteEditorConfig>(() =>
      getInitialEditorConfig<SiteEditorConfig>({
        adminBarPosition: 'bottom',
        blocks: [],
      })
    );

  // V2.9 : le dernier état de l'éditeur est conservé synchroniquement.
  // Ainsi, cliquer immédiatement sur « Enregistrer » après une modification
  // ne peut pas sauvegarder l'ancien render de React.
  const siteEditorConfigRef = useRef<SiteEditorConfig>(siteEditorConfig);

  useEffect(() => {
    siteEditorConfigRef.current = siteEditorConfig;
  }, [siteEditorConfig]);

  useEffect(() => {
    setBrandData((previous) =>
      mergeVisualTextIntoBrandData(previous, siteEditorConfig)
    );
  }, [siteEditorConfig]);

  // Le contenu publié serveur est la source commune aux visiteurs et à l'admin.
  // On ne révèle l'application qu'après la première synchronisation (ou fallback).
  const [publishedConfigReady, setPublishedConfigReady] = useState(() => hasLocalPublishedSiteConfig());




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
  // VISUAL EDITOR -> BRAND CONFIG BRIDGE
  // ===========================================================================
  // Les textes canoniques modifiés dans l'éditeur visuel sont aussi écrits
  // dans BrandConfig. Ils suivent ainsi exactement le même chemin de
  // persistance que le panneau Paramétrage.
  const mergeVisualTextIntoBrandData = (
    base: BrandConfig,
    editorConfig: SiteEditorConfig,
    previousEditorConfig?: SiteEditorConfig
  ): BrandConfig => {
    let next = base;
    let changed = false;

    // V5.2 — les blocs de l'éditeur qui correspondent à des données
    // canoniques ne doivent plus être retrouvés en comparant des chaînes.
    // L'ancien système faisait :
    //   "ancienne valeur" -> "nouvelle valeur"
    // ce qui échouait lorsque brandData contenait encore l'ancienne version
    // alors que le bloc publié contenait déjà la nouvelle.
    //
    // On utilise donc l'ID stable du bloc comme binding canonique.
    const applyCanonicalBinding = (block: EditorBlock) => {
      if (block.kind !== 'text' || typeof block.text !== 'string') return;

      const cleanText = block.text.replace(/^["“«]|["”»]$/g, '').trim();

      const bindings: Record<string, (value: string) => Partial<BrandConfig>> = {
        'element-1787065743054': (value) => ({ brandName: value }),
        'element-1787208612214': (value) => ({ tagline: value }),
        'element-1787210359401': (value) => ({ subtitle: value }),
      };

      const binding = bindings[block.id];
      if (!binding) return;

      const patch = binding(cleanText);
      next = {
        ...next,
        ...patch,
      };
      changed = true;
    };

    for (const block of editorConfig.blocks || []) {
      applyCanonicalBinding(block);
    }

    const replaceFirstValue = (
      value: unknown,
      oldValue: string,
      newValue: string
    ): [unknown, boolean] => {
      if (typeof value === 'string') {
        return value === oldValue ? [newValue, true] : [value, false];
      }

      if (Array.isArray(value)) {
        const copy = [...value];
        for (let index = 0; index < copy.length; index += 1) {
          const [replacement, didChange] = replaceFirstValue(
            copy[index],
            oldValue,
            newValue
          );
          if (didChange) {
            copy[index] = replacement;
            return [copy, true];
          }
        }
        return [value, false];
      }

      if (value && typeof value === 'object') {
        const copy: Record<string, unknown> = {
          ...(value as Record<string, unknown>),
        };
        for (const key of Object.keys(copy)) {
          const [replacement, didChange] = replaceFirstValue(
            copy[key],
            oldValue,
            newValue
          );
          if (didChange) {
            copy[key] = replacement;
            return [copy, true];
          }
        }
      }

      return [value, false];
    };

    const previousBlocks = previousEditorConfig?.blocks || [];

    for (const block of editorConfig.blocks || []) {
      if (!block.selector) continue;

      const previous = previousBlocks.find(
        (candidate) =>
          candidate.id === block.id || candidate.selector === block.selector
      );

      // PRIMARY PATH:
      // Compare the published/session snapshot with the current editor state.
      // This makes the editor behave exactly like the Customizer: whatever
      // canonical value changed is copied into BrandConfig before publication.
      if (
        previous &&
        block.kind === 'text' &&
        previous.kind === 'text' &&
        typeof previous.text === 'string' &&
        typeof block.text === 'string' &&
        previous.text !== block.text
      ) {
        const [replacement, didChange] = replaceFirstValue(
          next,
          previous.text,
          block.text
        );

        if (didChange) {
          next = replacement as BrandConfig;
          changed = true;
        }
      }

      if (
        previous &&
        previous.kind === 'media' &&
        block.kind === 'media' &&
        typeof previous.url === 'string' &&
        typeof block.url === 'string' &&
        previous.url !== block.url
      ) {
        const [replacement, didChange] = replaceFirstValue(
          next,
          previous.url,
          block.url
        );

        if (didChange) {
          next = replacement as BrandConfig;
          changed = true;
        }
      }

      const selector = block.selector;

      // Stable canonical Hero selectors remain explicit fallbacks for blocks
      // created before the session-baseline comparison existed.
      if (
        block.kind === 'text' &&
        typeof block.text === 'string' &&
        (selector.includes('[data-vce-hero-line="2"]') ||
          selector.includes('[data-vce-role="hero-line-2"]') ||
          selector.includes('[data-vce-selector="brand-name"]'))
      ) {
        next = { ...next, brandName: block.text };
        changed = true;
        continue;
      }

      if (
        block.kind === 'text' &&
        typeof block.text === 'string' &&
        (selector.includes('[data-vce-hero-line="1"]') ||
          selector.includes('[data-vce-role="hero-line-1"]') ||
          selector.includes('[data-vce-selector="hero-title-prefix"]'))
      ) {
        next = {
          ...next,
          theme: {
            ...defaultThemeConfig,
            ...(next.theme || {}),
            heroTitlePrefix: block.text,
          },
        };
        changed = true;
      }
    }

    return changed ? next : base;
  };

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
        // Le catalogue est publié avec le même bouton que le reste de
        // l'administration. Les fiches produits restent ensuite la source
        // unique pour les images, tailles, pastilles et caractéristiques.
        if (isAdminLoggedIn && Array.isArray(normalizedBrandData.jackets)) {
          const catalogResponse = await fetch('/api/admin/products', {
            method: 'PUT',
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
            },
            body: JSON.stringify({
              action: 'replace',
              products: normalizedBrandData.jackets,
            }),
          });

          const catalogBody = await catalogResponse.json().catch(() => null);
          if (!catalogResponse.ok || catalogBody?.success !== true) {
            throw new Error(catalogBody?.message || `Synchronisation catalogue: HTTP ${catalogResponse.status}`);
          }
        }

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

        // Dès que Redis confirme la publication, on conserve ce même
        // snapshot localement pour que le prochain démarrage soit instantané
        // et n'affiche jamais l'ancien bundle avant la configuration publiée.
        cachePublishedSiteConfig(config);

        // Le runtime est la source active : dès qu'Upstash a confirmé l'écriture,
        // la nouvelle version est considérée comme enregistrée.
        // GitHub est le fallback de déploiement et ne doit plus pouvoir annuler
        // une sauvegarde runtime réussie s'il est lent ou momentanément indisponible.
        setBrandData(normalizedBrandData);
        setSiteEditorConfig(nextEditorConfig);

        if (isAdminLoggedIn) {
          adminSessionSnapshotRef.current = {
            brandData: normalizedBrandData,
            editorConfig: nextEditorConfig,
          };
        }

        setPublishedConfigReady(true);

        let commitSha: string | null = null;
        let githubWarning: string | null = null;

        try {
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

          const publishBody = await publishResponse.json().catch(() => null);

          if (!publishResponse.ok) {
            githubWarning =
              publishBody?.error ||
              `Publication GitHub: HTTP ${publishResponse.status}`;
            console.warn('Publication GitHub différée/échouée:', githubWarning);
          } else {
            commitSha = publishBody?.commitSha || null;
          }
        } catch (githubError) {
          githubWarning =
            githubError instanceof Error
              ? githubError.message
              : 'Publication GitHub indisponible.';
          console.warn('Publication GitHub différée/échouée:', githubWarning);
        }

        return {
          success: true,
          commitSha,
          warning: githubWarning,
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

      // Le dernier snapshot serveur devient immédiatement le snapshot de
      // démarrage du prochain chargement. Cela évite de repartir du bundle
      // historique entre deux déploiements.
      cachePublishedSiteConfig(config);

      if (config.brandData && typeof config.brandData === 'object') {
        setBrandData((previous) => {
          const serverBrandData = config.brandData as Partial<BrandConfig>;
          // Le catalogue produit est une source séparée (Upstash /api/products).
          // Le snapshot visuel peut contenir un ancien tableau `jackets`; ne le
          // remplaçons jamais ici, sinon une course entre les deux requêtes peut
          // faire revenir le site public à 1 seul produit alors que l'admin en
          // possède 5. Les produits serveur seront appliqués par fetchServerProducts().
          const { jackets: _publishedJackets, ...publishedBrandWithoutCatalog } = serverBrandData;
          void _publishedJackets;
          return {
            ...previous,
            ...publishedBrandWithoutCatalog,
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
        const publishedEditorConfig = config.editorConfig as SiteEditorConfig;
        siteEditorConfigRef.current = publishedEditorConfig;
        setSiteEditorConfig(publishedEditorConfig);

        setBrandData((previous) =>
          mergeVisualTextIntoBrandData(previous, publishedEditorConfig)
        );
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

      // Une seule convention image dans toute l'application :
      // gallery[0] = image principale = heroImage.
      // Les anciennes fiches pouvaient conserver un heroImage historique alors
      // que gallery[0] contenait déjà la nouvelle image. On corrige ce décalage
      // à la lecture pour que Hero, cartes, Showcase, Lookbook et administration
      // utilisent exactement la même première image.
      const products = data.products.map((product: any) => {
        const rawGallery = Array.isArray(product?.gallery) ? product.gallery : [];
        const cleanGallery: string[] = Array.from(new Set(rawGallery
          .map((url: unknown) => String(url || '').trim())
          .filter(Boolean)));
        // heroImage is authoritative. Older records may have a stale gallery[0].
        const explicitHero = String(product?.heroImage || '').trim();
        const primary = explicitHero || cleanGallery[0] || '';
        const gallery = primary
          ? [primary, ...cleanGallery.filter((url: string) => url !== primary)]
          : cleanGallery;
        return normalizeProductAvailability({
          ...product,
          heroImage: primary,
          gallery,
        });
      });

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
      // V2.3 : le premier rendu public attend désormais le catalogue serveur.
      // Sans cela, le Hero pouvait afficher brièvement les images du bundle
      // généré alors que l'administration utilisait déjà les images du catalogue.
      const publishedPromise = fetchPublishedSiteConfig();
      const productsPromise = fetchServerProducts();
      const authPromise = verifyAdminSessionServer();

      try {
        const [loaded] = await Promise.all([publishedPromise, productsPromise]);
        setPublishedConfigReady(true);
        window.dispatchEvent(
          new CustomEvent('site-bootstrap-ready', {
            detail: { published: loaded },
          })
        );
      } catch (error) {
        console.warn('Initialisation du contenu publié:', error);
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
  // ADMIN SESSION SNAPSHOT
  // ===========================================================================

  useEffect(() => {
    if (isAdminLoggedIn && !adminSessionSnapshotRef.current) {
      adminSessionSnapshotRef.current = {
        brandData,
        editorConfig: siteEditorConfig,
      };
    }

    if (!isAdminLoggedIn) {
      adminSessionSnapshotRef.current = null;
    }
  }, [isAdminLoggedIn]);

  // ===========================================================================
  // ADMIN LOGOUT
  // ===========================================================================

  const handleLogout = async () => {
    // V5.2 : ne jamais recharger /api/site-config au logout.
    //
    // La sauvegarde a déjà persisté le snapshot complet. Refaire une lecture
    // serveur ici pouvait réintroduire un brandData ancien alors que
    // editorConfig contenait la nouvelle valeur. L'observateur doit continuer
    // exactement avec le même état que celui validé dans l'admin.
    try {
      await saveQueueRef.current;
    } catch (error) {
      console.warn(
        'Impossible de finaliser la sauvegarde avant le logout:',
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

    adminSessionSnapshotRef.current = null;

    setIsAdminLoggedIn(false);
    setIsCustomizerOpen(false);
    setIsOrdersOpen(false);
    setIsAdminBarVisible(false);
  };

  // ===========================================================================
  // SAVE VISUAL EDITOR
  // ===========================================================================

  const handleSaveVisualEditor = async (
    nextEditorConfig?: SiteEditorConfig
  ) => {
    // Même chemin de persistance que le panneau Paramétrage :
    // /api/site-config est appelé avec le snapshot complet brandData +
    // editorConfig. La seule différence est la partie du snapshot modifiée.
    const configToSave =
      nextEditorConfig ?? siteEditorConfigRef.current;

    siteEditorConfigRef.current = configToSave;
    setSiteEditorConfig(configToSave);

    const sessionBaseline = adminSessionSnapshotRef.current?.editorConfig;

    const brandDataWithVisualText = mergeVisualTextIntoBrandData(
      brandData,
      configToSave,
      sessionBaseline
    );

    const result = await saveSiteConfig(
      brandDataWithVisualText,
      configToSave
    );

    if (result.success) {
      // IMPORTANT : ne jamais remettre nextEditorConfig ici s'il est undefined.
      // Le dernier snapshot sauvegardé reste celui affiché et celui publié.
      siteEditorConfigRef.current = configToSave;
      setSiteEditorConfig(configToSave);

      setReorderToast(
        result.warning
          ? `✓ Enregistré sur le site. GitHub : ${result.warning}`
          : result.commitSha
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

    const sectionBackgroundImage =
      theme?.sectionBackgroundImages?.[sectionId] || '';

    const sectionBackgroundOverlay = sectionBackgroundImage ? (
      <div
        aria-hidden="true"
        className="absolute inset-0 z-30 pointer-events-none bg-cover bg-center bg-no-repeat mix-blend-soft-light"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url(${JSON.stringify(sectionBackgroundImage)})`,
          opacity: sectionId === 'hero' ? 0.20 : 0.28,
        }}
      />
    ) : null;

    if (
      !isAdminLoggedIn ||
      !isDragReorderMode
    ) {
      return (
        <div key={sectionId} className="relative overflow-hidden" style={{ width: `${Math.min(100, Math.max(60, Number(theme.sectionWidthPercent?.[sectionId] ?? 100)))}%`, marginInline: 'auto' }}>
          <FloatingMediaLayer sectionId={sectionId} items={siteEditorConfig.floatingImages} />
          {content}
          {sectionBackgroundOverlay}
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

        <div className="relative overflow-hidden mx-auto" style={{ width: `${Math.min(100, Math.max(60, Number(theme.sectionWidthPercent?.[sectionId] ?? 100)))}%` }}>
          <FloatingMediaLayer sectionId={sectionId} items={siteEditorConfig.floatingImages} />
          {content}
          {sectionBackgroundOverlay}
        </div>
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

  if (!publishedConfigReady) {
    return (
      <div className="min-h-screen bg-[#121613] flex items-center justify-center text-[#d4af37]">
        <div className="flex flex-col items-center gap-3" aria-label="Chargement du site">
          <div className="w-8 h-8 rounded-full border-2 border-[#3b4b3e] border-t-[#d4af37] animate-spin" />
          <span className="text-[10px] uppercase tracking-[0.28em] text-[#8f9f91]">
            Maison Mailha
          </span>
        </div>
      </div>
    );
  }

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

      <SiteBlocksRenderer config={siteEditorConfig} enabled={publishedConfigReady} />

      {isAdminLoggedIn && (
        <SiteVisualEditor
          brandData={brandData}
          config={siteEditorConfig}
          onChange={(nextConfig) => {
            siteEditorConfigRef.current = nextConfig;
            setSiteEditorConfig(nextConfig);
          }}
          onSave={async (nextConfig) => {
            await handleSaveVisualEditor(nextConfig);
          }}
          onOpenCustomizer={() => handleOpenEditor('theme')}
          floatingMediaOpen={isFloatingMediaOpen}
          onToggleFloatingMedia={() => setIsFloatingMediaOpen((current) => !current)}
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
              onOpenProducts={() => handleOpenEditor('articles')}
              onOpenLogoEditor={() => setIsLogoEditorOpen(true)}
              onToggleFloatingMedia={() => setIsFloatingMediaOpen((current) => !current)}
              floatingMediaOpen={isFloatingMediaOpen}
              onOpenSecurity={handleOpenSecurity}
              onLogout={handleLogout}
            />
          }
        />
      )}

      {!isGitePageOpen && (
        <>
          <div className="site-navbar-scale">
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
          </div>
          <main className="site-content-scale">
            {sectionOrder.map((sectionId, index) => renderSection(sectionId, index))}
          </main>
        </>
      )}

      {isGitePageOpen && (
        <GitePage
          brandData={brandData}
          onBackToVitrine={handleBackToVitrine}
          onAdmin={() => handleOpenEditor('theme')}
          floatingImages={siteEditorConfig.floatingImages}
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
        products={brandData.jackets}
        onRefreshProducts={fetchServerProducts}
        initialTab={
          customizerTab
        }
      />
    </div>
  );
}