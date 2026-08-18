import React, { useState, useEffect } from 'react';
import {
  BrandConfig,
  JacketModel,
  Hotspot,
  ButtonStyleId,
  ButtonRadiusId,
  CardStyleId,
  HeroLayoutId,
  ShowcaseLayoutId,
  SectionId,
  NavigationId,
  ThemeConfig,
  ComparisonCriterion,
  ProductBlockId,
  TextAlignId,
  ButtonAlignId,
  ContainerWidthId,
  ContentPaddingId,
  CardMediaPositionId,
} from '../types';
import {
  Sliders,
  Save,
  RotateCcw,
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  Key,
  ShieldCheck,
  Download,
  Upload,
  CheckCircle2,
  Lock,
  Palette,
  Layers,
  Type,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Mail,
  GitBranch,
  Terminal,
  Copy,
  ExternalLink,
  HelpCircle,
  Globe,
  ShoppingBag,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize,
  Move,
  Tag,
  PackagePlus,
  AlertCircle,
  Crosshair,
  MapPin,
  Ruler,
  SlidersHorizontal,
  GripVertical,
  MousePointer,
  Scale
} from 'lucide-react';
import {
  buttonModelPresets,
  cardModelPresets,
  radiusPresets,
  sectionMeta,
  defaultThemeConfig,
  getButtonClasses,
  getCardClasses,
} from '../utils/themeStyles';
import { getStoredCredentials, saveAdminCredentials, resetPasswordServer, maskEmail, AdminCredentials } from '../utils/auth';
import { ButtonManager } from './ButtonManager';

interface BrandCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandData: BrandConfig;
  onSave: (newData: BrandConfig) => void;
  onReset: () => void;
  initialTab?: 'brand' | 'articles' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security' | 'orders' | 'github';
}

const productBlockMeta: Record<ProductBlockId, { name: string; icon: string; desc: string }> = {
  'title-price': {
    name: 'Titre, Sous-titre & Prix',
    icon: '🏷️',
    desc: 'Nom de la pièce d’exception, catégorie, prix et mentions de confection.',
  },
  'description': {
    name: 'Description & Récit Terroir',
    icon: '📜',
    desc: 'Présentation de la coupe, inspiration montagnarde et détails poétiques.',
  },
  'colors': {
    name: 'Sélecteur de Nuances & Couleurs',
    icon: '🎨',
    desc: 'Pastilles de teintes minérales et lainières avec prévisualisation.',
  },
  'sizes': {
    name: 'Guide & Sélection des Tailles',
    icon: '📏',
    desc: 'Boutons de tailles (XS à XXL) et informations de prise de mesure.',
  },
  'specs': {
    name: 'Spécifications & Matières',
    icon: '⚙️',
    desc: 'Poids, imperméabilité, indice de chaleur, origine et conseils d’entretien.',
  },
  'cta': {
    name: 'Bouton d’Action & Commande',
    icon: '🛒',
    desc: 'Bouton principal de réservation et commande sur mesure atelier.',
  },
};

const samplePresetImages = [
  { label: 'Veste Cimes (Kaki / Bronze)', url: '/src/assets/images/veste-cimes.png' },
  { label: 'Manteau Pastorale (Anthracite)', url: '/src/assets/images/manteau-pastorale.png' },
  { label: 'Ambiance Atelier Pyrénéen', url: '/src/assets/images/hero-montagne.png' },
  { label: 'Coupe Haute Montagne (Laine)', url: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Veste Cuir & Drap de Laine', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Gilet Berger Traditionnel', url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=80' },
];

export const BrandCustomizerModal: React.FC<BrandCustomizerModalProps> = ({
  isOpen,
  onClose,
  brandData,
  onSave,
  onReset,
  initialTab = 'theme',
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<BrandConfig>(() => {
    const copy = JSON.parse(JSON.stringify(brandData));
    if (!copy.theme) {
      copy.theme = { ...defaultThemeConfig };
    }
    if (!Array.isArray(copy.theme.navOrder)) {
      copy.theme.navOrder = ['collection', 'comparatif', 'origines', 'lookbook', 'contact'];
    }
    if (!copy.ordersEmail) {
      copy.ordersEmail = 'contact@maisondespyrenees.fr';
    }
    if (!Array.isArray(copy.jackets)) {
      copy.jackets = [];
    }
    return copy;
  });

  const getInitialTab = (): 'brand' | 'articles' | 'theme' | 'layouts' | 'labels' | 'security' | 'orders' | 'github' => {
    if (initialTab === 'j1' || initialTab === 'j2' || initialTab === 'articles') return 'articles';
    if (initialTab === 'brand' || initialTab === 'theme' || initialTab === 'layouts' || initialTab === 'labels' || initialTab === 'security' || initialTab === 'orders' || initialTab === 'github') {
      return initialTab;
    }
    return 'theme';
  };

  const [activeTab, setActiveTab] = useState<'brand' | 'articles' | 'theme' | 'layouts' | 'labels' | 'security' | 'orders' | 'github'>(
    getInitialTab()
  );

  // Selected article index for editing in articles tab
  const [selectedJacketIndex, setSelectedJacketIndex] = useState<number>(() => {
    if (initialTab === 'j2' && formData.jackets.length > 1) return 1;
    return 0;
  });

  // Security Credentials state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [draggedNavId, setDraggedNavId] = useState<NavigationId | null>(null);
  const [dragOverNavId, setDragOverNavId] = useState<NavigationId | null>(null);

  // Custom Size and Hotspot state
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customSizesList, setCustomSizesList] = useState<string[]>([
    'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Taille unique', 'Sur-mesure', '34', '36', '38', '40', '42', '44', '46', 'Enfant'
  ]);
  const [activeEditingHotspotId, setActiveEditingHotspotId] = useState<string | null>(null);

  useEffect(() => {
    const creds = getStoredCredentials();
    setAdminUsername(creds.username);
    setAdminEmail(creds.email && !creds.email.includes('baheu.matthieu65') ? creds.email : 'contact@maisondespyrenees.fr');
  }, [isOpen]);

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'j1') {
        setActiveTab('articles');
        setSelectedJacketIndex(0);
      } else if (initialTab === 'j2') {
        setActiveTab('articles');
        setSelectedJacketIndex(Math.min(1, Math.max(0, formData.jackets.length - 1)));
      } else if (initialTab === 'articles') {
        setActiveTab('articles');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  const currentTheme = formData.theme || defaultThemeConfig;

  const updateTheme = (fields: Partial<ThemeConfig>) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...(prev.theme || defaultThemeConfig),
        ...fields,
      },
    }));
  };

  const DEFAULT_CRITERIA_LIST: ComparisonCriterion[] = [
    { id: 'crit_category', label: 'Style principal', key: 'category' },
    { id: 'crit_fabric', label: 'Tissu signature', key: 'fabric' },
    { id: 'crit_warmth', label: 'Indice de Chaleur', key: 'warmth' },
    { id: 'crit_water', label: 'Résistance à la pluie', key: 'water' },
    { id: 'crit_weight', label: 'Poids de la veste', key: 'weight' },
    { id: 'crit_fit', label: 'Coupe & Silhouette', key: 'fit' },
    { id: 'crit_care', label: 'Entretien', key: 'care' },
    { id: 'crit_price', label: 'Prix public', key: 'price' },
  ];

  const [newCriterionLabel, setNewCriterionLabel] = useState('');

  const activeCriteria = currentTheme.comparisonCriteria && currentTheme.comparisonCriteria.length > 0
    ? currentTheme.comparisonCriteria
    : DEFAULT_CRITERIA_LIST;

  const handleAddCriterion = (label: string) => {
    if (!label.trim()) return;
    const newKey = `custom_${Date.now()}`;
    const newCrit: ComparisonCriterion = {
      id: `crit_${Date.now()}`,
      label: label.trim(),
      key: newKey,
    };
    updateTheme({
      comparisonCriteria: [...activeCriteria, newCrit],
    });
  };

  const handleUpdateCriterionLabel = (id: string, newLabel: string) => {
    const updated = activeCriteria.map((c) =>
      c.id === id ? { ...c, label: newLabel } : c
    );
    updateTheme({ comparisonCriteria: updated });
  };

  const handleDeleteCriterion = (id: string) => {
    if (activeCriteria.length <= 1) {
      alert('Le tableau comparatif doit conserver au moins un critère.');
      return;
    }
    const updated = activeCriteria.filter((c) => c.id !== id);
    updateTheme({ comparisonCriteria: updated });
  };

  const handleChangeBrand = (field: keyof BrandConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ==========================================
  // ARTICLE / JACKET CRUD HANDLERS
  // ==========================================
  const handleAddNewJacket = () => {
    const newIndex = formData.jackets.length + 1;
    const newJacket: JacketModel = {
      id: `veste-modele-${Date.now().toString().slice(-4)}`,
      name: `Veste Modèle ${newIndex}`,
      subTitle: 'Création Artisanale Pyrénéenne',
      category: 'Haute Montagne',
      price: 890,
      currency: '€',
      heroImage: '/src/assets/images/veste-cimes.png',
      gallery: [
        '/src/assets/images/veste-cimes.png',
        '/src/assets/images/manteau-pastorale.png',
        '/src/assets/images/hero-montagne.png',
      ],
      description: 'Pièce authentique confectionnée dans notre atelier avec les plus nobles laines des vallées pyrénéennes.',
      longDescription: 'Chaque pièce est coupée à la main et assemblée avec une attention méticuleuse portée aux finitions, boutons en corne et doublure respirante.',
      tagline: 'L’alliance de la chaleur brute et du raffinement intemporel.',
      fabrics: ['100% Drap de Laine Vierge des Pyrénées', 'Doublure Cupro Respirante', 'Boutons en Corne Véritable'],
      colors: [
        { name: 'Kaki Haute Forêt', hex: '#445138' },
        { name: 'Anthracite Minéral', hex: '#26292b' },
        { name: 'Bronze Pyrénéen', hex: '#635336' },
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Sur Mesure'],
      features: [
        { iconName: 'Feather', title: 'Chaleur Naturelle', desc: 'Protection thermique optimale jusqu’à -15°C.' },
        { iconName: 'CloudRain', title: 'Déperlance Naturelle', desc: 'La lanoline préserve l’imperméabilité des fibres.' },
        { iconName: 'Shield', title: 'Confection Garantie à Vie', desc: 'Réparation et entretien assurés par notre atelier.' },
      ],
      specs: {
        weight: '1 250 g',
        waterResistance: 'Déperlant naturel',
        warmthRating: 'Idéal -10°C à +12°C',
        fitType: 'Coupe Droite Ajustée',
        origin: 'Atelier de Cauterets (Hautes-Pyrénées, France)',
        care: 'Nettoyage à sec uniquement',
      },
      hotspots: [
        { id: 'h1', title: 'Col Montant Doublé', description: 'Empêche les infiltrations d’air glacé en altitude.', x: 50, y: 18, category: 'cut' },
        { id: 'h2', title: 'Poches Poitrines Passepoilées', description: 'Taillées pour accueillir gants et carnet d’alpiniste.', x: 42, y: 38, category: 'utility' },
        { id: 'h3', title: 'Drap de Laine Brut Feutré', description: 'Tissage dense résistant aux ronces et à l’usure des cimes.', x: 60, y: 65, category: 'fabric' },
      ],
    };

    setFormData((prev) => ({
      ...prev,
      jackets: [...prev.jackets, newJacket],
    }));

    setSelectedJacketIndex(formData.jackets.length);
  };

  const handleDeleteJacket = (indexToDelete: number) => {
    if (formData.jackets.length <= 1) {
      alert('Votre boutique doit conserver au moins 1 article.');
      return;
    }

    const jacketName = formData.jackets[indexToDelete]?.name || 'cet article';
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement "${jacketName}" de votre catalogue ?`)) {
      return;
    }

    setFormData((prev) => {
      const updated = prev.jackets.filter((_, idx) => idx !== indexToDelete);
      return { ...prev, jackets: updated };
    });

    setSelectedJacketIndex((prev) => Math.max(0, prev - 1));
  };

  const handleChangeCurrentJacket = (field: keyof JacketModel, value: any) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      if (jackets[selectedJacketIndex]) {
        jackets[selectedJacketIndex] = {
          ...jackets[selectedJacketIndex],
          [field]: value,
        };
      }
      return { ...prev, jackets };
    });
  };

  const handleChangeCurrentJacketSpecs = (specField: string, value: string) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      if (jackets[selectedJacketIndex]) {
        jackets[selectedJacketIndex] = {
          ...jackets[selectedJacketIndex],
          specs: {
            ...jackets[selectedJacketIndex].specs,
            [specField]: value,
          },
        };
      }
      return { ...prev, jackets };
    });
  };

  // Color CRUD
  const handleAddColor = () => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr) {
        jackets[selectedJacketIndex] = {
          ...curr,
          colors: [...curr.colors, { name: 'Nouvelle Nuance', hex: '#526355' }],
        };
      }
      return { ...prev, jackets };
    });
  };

  const handleUpdateColor = (colorIdx: number, key: 'name' | 'hex', val: string) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr && curr.colors[colorIdx]) {
        const colors = [...curr.colors];
        colors[colorIdx] = { ...colors[colorIdx], [key]: val };
        jackets[selectedJacketIndex] = { ...curr, colors };
      }
      return { ...prev, jackets };
    });
  };

  const handleDeleteColor = (colorIdx: number) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr && curr.colors.length > 1) {
        jackets[selectedJacketIndex] = {
          ...curr,
          colors: curr.colors.filter((_, idx) => idx !== colorIdx),
        };
      }
      return { ...prev, jackets };
    });
  };

  // Size Checkbox and Custom Size Term Management
  const handleToggleSize = (sizeTerm: string) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr) {
        const currentSizes = curr.sizes || [];
        const exists = currentSizes.includes(sizeTerm);
        const updatedSizes = exists
          ? currentSizes.filter((s) => s !== sizeTerm)
          : [...currentSizes, sizeTerm];
        jackets[selectedJacketIndex] = {
          ...curr,
          sizes: updatedSizes,
        };
      }
      return { ...prev, jackets };
    });
  };

  const handleRemoveCustomSizeTerm = (sizeTerm: string) => {
    setCustomSizesList((prev) => prev.filter((s) => s !== sizeTerm));
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr && curr.sizes) {
        jackets[selectedJacketIndex] = {
          ...curr,
          sizes: curr.sizes.filter((s) => s !== sizeTerm),
        };
      }
      return { ...prev, jackets };
    });
  };

  const handleAddCustomSizeTerm = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (!customSizesList.includes(trimmed)) {
      setCustomSizesList((prev) => [...prev, trimmed]);
    }
    // Also enable it for current jacket
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr) {
        const currentSizes = curr.sizes || [];
        if (!currentSizes.includes(trimmed)) {
          jackets[selectedJacketIndex] = {
            ...curr,
            sizes: [...currentSizes, trimmed],
          };
        }
      }
      return { ...prev, jackets };
    });
    setCustomSizeInput('');
  };

  // Hotspot Points Editor CRUD
  const handleAddHotspot = () => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr) {
        const hotspots = curr.hotspots || [];
        const newHotspot: Hotspot = {
          id: `h_${Date.now()}`,
          title: 'Nouveau point d’intérêt',
          description: 'Description du détail de confection.',
          x: 50,
          y: 50,
          category: 'fabric',
        };
        jackets[selectedJacketIndex] = {
          ...curr,
          hotspots: [...hotspots, newHotspot],
        };
      }
      return { ...prev, jackets };
    });
  };

  const handleUpdateHotspot = (hotspotId: string, field: keyof Hotspot, value: any) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr && curr.hotspots) {
        const hotspots = curr.hotspots.map((h) => {
          if (h.id === hotspotId) {
            return { ...h, [field]: value };
          }
          return h;
        });
        jackets[selectedJacketIndex] = { ...curr, hotspots };
      }
      return { ...prev, jackets };
    });
  };

  const handleDeleteHotspot = (hotspotId: string) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr && curr.hotspots) {
        jackets[selectedJacketIndex] = {
          ...curr,
          hotspots: curr.hotspots.filter((h) => h.id !== hotspotId),
        };
      }
      return { ...prev, jackets };
    });
  };

  // Gallery Image CRUD
  const handleAddGalleryImage = (url: string) => {
    if (!url.trim()) return;
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr) {
        jackets[selectedJacketIndex] = {
          ...curr,
          gallery: [...curr.gallery, url.trim()],
        };
      }
      return { ...prev, jackets };
    });
  };

  const handleDeleteGalleryImage = (imgIdx: number) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr) {
        jackets[selectedJacketIndex] = {
          ...curr,
          gallery: curr.gallery.filter((_, idx) => idx !== imgIdx),
        };
      }
      return { ...prev, jackets };
    });
  };

  // Sizes CRUD
  const handleAddSize = (sizeStr: string) => {
    if (!sizeStr.trim()) return;
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr && !curr.sizes.includes(sizeStr.trim())) {
        jackets[selectedJacketIndex] = {
          ...curr,
          sizes: [...curr.sizes, sizeStr.trim()],
        };
      }
      return { ...prev, jackets };
    });
  };

  const handleDeleteSize = (sizeIdx: number) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets];
      const curr = jackets[selectedJacketIndex];
      if (curr && curr.sizes.length > 1) {
        jackets[selectedJacketIndex] = {
          ...curr,
          sizes: curr.sizes.filter((_, idx) => idx !== sizeIdx),
        };
      }
      return { ...prev, jackets };
    });
  };

  // ==========================================
  // NAVIGATION REORDERING
  // ==========================================
  const defaultNavOrder: NavigationId[] = ['collection', 'comparatif', 'origines', 'lookbook', 'contact'];

  const navLabelMap: Record<NavigationId, string> = {
    collection: currentTheme.collectionTabLabel || 'Les 2 Vestes',
    comparatif: currentTheme.comparatifTabLabel || 'Tableau Comparatif',
    origines: currentTheme.originesTabLabel || 'L’Esprit Pyrénées',
    lookbook: currentTheme.lookbookTabLabel || 'Lookbook',
    contact: currentTheme.contactTabLabel || 'Contact & Atelier',
  };

  const navOrder = (currentTheme.navOrder?.length
    ? currentTheme.navOrder
    : defaultNavOrder
  ) as NavigationId[];

  const moveNavItem = (sourceId: NavigationId, targetId: NavigationId) => {
    if (sourceId === targetId) return;
    const next = [...navOrder];
    const sourceIndex = next.indexOf(sourceId);
    const targetIndex = next.indexOf(targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    updateTheme({ navOrder: next });
  };

  // ==========================================
  // SECTION & BLOCKS REORDERING HANDLERS
  // ==========================================
  const handleMoveSection = (sectionId: SectionId, direction: 'up' | 'down') => {
    const currentOrder = [...(currentTheme.sectionOrder || defaultThemeConfig.sectionOrder)];
    const index = currentOrder.indexOf(sectionId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = currentOrder[index - 1];
      currentOrder[index - 1] = currentOrder[index];
      currentOrder[index - 1 + 1] = temp;
      updateTheme({ sectionOrder: currentOrder });
    } else if (direction === 'down' && index < currentOrder.length - 1) {
      const temp = currentOrder[index + 1];
      currentOrder[index + 1] = currentOrder[index];
      currentOrder[index] = temp;
      updateTheme({ sectionOrder: currentOrder });
    }
  };

  const handleToggleSectionVisibility = (sectionId: SectionId) => {
    const hidden = [...(currentTheme.hiddenSections || [])];
    const index = hidden.indexOf(sectionId);
    if (index > -1) {
      hidden.splice(index, 1);
    } else {
      if (sectionId === 'hero' || sectionId === 'collection') {
        alert('Cette section maîtresse ne peut pas être entièrement masquée.');
        return;
      }
      hidden.push(sectionId);
    }
    updateTheme({ hiddenSections: hidden });
  };

  // Product Page Blocks Reorder
  const handleMoveProductBlock = (blockId: ProductBlockId, direction: 'up' | 'down') => {
    const currentOrder = [...(currentTheme.productBlocksOrder || defaultThemeConfig.productBlocksOrder || [])];
    const index = currentOrder.indexOf(blockId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = currentOrder[index - 1];
      currentOrder[index - 1] = currentOrder[index];
      currentOrder[index] = temp;
      updateTheme({ productBlocksOrder: currentOrder });
    } else if (direction === 'down' && index < currentOrder.length - 1) {
      const temp = currentOrder[index + 1];
      currentOrder[index + 1] = currentOrder[index];
      currentOrder[index] = temp;
      updateTheme({ productBlocksOrder: currentOrder });
    }
  };

  // Save & Security Handlers
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (newPassword) {
      if (newPassword.length < 4) {
        setSecurityMessage({
          type: 'error',
          text: 'Le nouveau mot de passe doit contenir au moins 4 caractères.',
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        setSecurityMessage({
          type: 'error',
          text: 'La confirmation ne correspond pas au nouveau mot de passe.',
        });
        return;
      }

      const res = await resetPasswordServer(currentPassword, newPassword);
      if (!res.success) {
        setSecurityMessage({
          type: 'error',
          text: res.message || 'Erreur lors de la mise à jour du mot de passe.',
        });
        return;
      }
    }

    saveAdminCredentials({
      username: adminUsername.trim() || 'admin',
      email: adminEmail.trim() || 'contact@maisondespyrenees.fr',
      lastUpdated: new Date().toISOString(),
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityMessage({
      type: 'success',
      text: 'Informations administrateur enregistrées avec succès !',
    });
  };

  const handleExportConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pyrenees-site-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.brandName && parsed.jackets) {
            setFormData(parsed);
            alert('Configuration importée avec succès ! Pensez à enregistrer pour valider.');
          } else {
            alert('Le format du fichier JSON importé est invalide.');
          }
        } catch (err) {
          alert('Erreur lors de la lecture du fichier JSON.');
        }
      };
    }
  };

  const currentJacket = formData.jackets[selectedJacketIndex] || formData.jackets[0];
  const previewBtnClasses = getButtonClasses(currentTheme, 'primary');
  const previewSecBtnClasses = getButtonClasses(currentTheme, 'secondary');
  const previewCard = getCardClasses(currentTheme);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-6xl bg-[#141a15] border border-[#3b473e] rounded-3xl shadow-2xl overflow-hidden text-[#e2d5c3] flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-[#18201a] border-b border-[#2b372d] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#f3ece0] flex items-center space-x-2">
                <span>Panneau de Personnalisation Intégrale</span>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 font-sans">
                  Admin
                </span>
              </h3>
              <p className="text-xs text-[#a3b1a5]">
                Modifiez en direct vos articles (ajout/suppression), emplacements des objets, textes, modules et boutons.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111612] border border-[#3c4c3f]">
              <span className="text-[9px] uppercase tracking-widest text-[#87968a]">Aperçu</span>
              <span
                style={getButtonInlineStyle(currentTheme, 'navbar-order')}
                className={`min-w-[120px] justify-center text-[10px] uppercase tracking-widest ${getButtonClasses(currentTheme, 'primary', 'navbar-order')}`}
              >
                {currentTheme.orderButtonText || 'Commander'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#9c7844] to-[#d4af37] text-[#121613] font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer & Appliquer</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#202922] hover:bg-[#2e3b30] flex items-center justify-center text-[#a3b1a5] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-[#2a362c] bg-[#111612] px-4 py-2 space-x-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'theme'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Palette className="w-4 h-4 text-[#d4af37]" />
            <span>1. Styles de Boutons & Cartes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layouts')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'layouts'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#b89f74]" />
            <span>2. Formats & Emplacements des Blocs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('articles')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'articles'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Tag className="w-4 h-4 text-[#d4af37]" />
            <span>3. Articles & Catalogue ({formData.jackets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('labels')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'labels'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Type className="w-4 h-4 text-[#b89f74]" />
            <span>4. Textes & Libellés</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('brand')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'brand'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#b89f74]" />
            <span>5. Identité & Terroir</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Key className="w-4 h-4 text-[#a3b1a5]" />
            <span>6. Sécurité & Emails</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'github'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <GitBranch className="w-4 h-4 text-[#d4af37]" />
            <span>7. GitHub & Déploiement</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: THEME & BUTTONS PRESETS                            */}
          {/* ========================================================= */}
          {activeTab === 'theme' && (
            <div className="space-y-8 animate-fadeIn">
              {/* 1. BUTTON STYLE SELECTION */}
              <div className="space-y-4">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold flex items-center space-x-2">
                  <span>Modèles & Matières des Boutons</span>
                  <span className="text-xs text-[#d4af37] font-normal font-sans">({buttonModelPresets.length} variantes d'exception)</span>
                </h4>
                <p className="text-xs text-[#a3b1a5]">
                  Sélectionnez l'ambiance matérielle appliquée instantanément à tous les boutons d'action du site :
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buttonModelPresets.map((preset) => {
                    const isSelected = currentTheme.buttonStyle === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => updateTheme({ buttonStyle: preset.id })}
                        className={`p-4 rounded-2xl cursor-pointer border-2 transition-all space-y-3 relative ${
                          isSelected
                            ? 'bg-[#212c23] border-[#d4af37] shadow-xl shadow-[#d4af37]/10'
                            : 'bg-[#181f19] border-[#2f3d32] hover:border-[#526a57]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-black/40 text-[#d4af37] border border-[#d4af37]/40">
                            {preset.badge}
                          </span>
                          {isSelected && (
                            <span className="flex items-center space-x-1 text-xs text-[#d4af37] font-bold">
                              <Check className="w-4 h-4" />
                              <span>Actif</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h5 className="font-serif text-base text-[#f3ece0] font-semibold">{preset.name}</h5>
                          <p className="text-xs text-[#a3b1a5] mt-1 leading-relaxed">{preset.description}</p>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            className={`w-full py-2 text-xs uppercase tracking-wider ${currentTheme.buttonRadius || 'rounded-full'} ${preset.primaryClass}`}
                          >
                            Exemple : {currentTheme.orderButtonText || 'Commander'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. BUTTON RADIUS */}
              <div className="space-y-4 pt-4 border-t border-[#2a362c]">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold">
                  Forme & Arrondi des Boutons
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {radiusPresets.map((r) => {
                    const isSelected = currentTheme.buttonRadius === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => updateTheme({ buttonRadius: r.id })}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#212c23] border-[#d4af37] text-[#d4af37]'
                            : 'bg-[#181f19] border-[#2f3d32] text-[#a3b1a5] hover:border-[#526a57]'
                        }`}
                      >
                        <div className="text-xs font-bold font-serif">{r.name}</div>
                        <div className="text-[10px] text-[#7d8c7f] mt-0.5">{r.radiusLabel}</div>
                        <div className={`mt-2 py-1 bg-[#253227] text-[10px] border border-[#435747] ${r.cssClass}`}>
                          Bouton
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <ButtonManager theme={currentTheme} updateTheme={updateTheme} />

              {/* 3. CARD STYLES */}
              <div className="space-y-4 pt-4 border-t border-[#2a362c]">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold">
                  Style & Relief des Cartes Produits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cardModelPresets.map((c) => {
                    const isSelected = currentTheme.cardStyle === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => updateTheme({ cardStyle: c.id })}
                        className={`p-4 rounded-2xl cursor-pointer border-2 transition-all space-y-2 ${
                          isSelected
                            ? 'bg-[#212c23] border-[#d4af37] shadow-xl'
                            : 'bg-[#181f19] border-[#2f3d32] hover:border-[#526a57]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-[#f3ece0]">{c.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-[#d4af37]">{c.badge}</span>
                        </div>
                        <p className="text-xs text-[#a3b1a5]">{c.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: FORMATS & SECTION / BLOCKS PLACEMENT               */}
          {/* ========================================================= */}
          {activeTab === 'layouts' && (
            <div className="space-y-8 animate-fadeIn">
              {/* 1. ALIGNMENT & POSITIONING CONTROLS (User Requested) */}
              <div className="p-5 rounded-2xl bg-[#18201a] border border-[#3b4b3e] space-y-5">
                <h4 className="font-serif text-base text-[#f3ece0] font-semibold flex items-center space-x-2 text-[#d4af37]">
                  <Move className="w-5 h-5" />
                  <span>Emplacement, Alignements & Marges des Textes et Boutons</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Text Alignment */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Alignement des Textes :
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#121613] rounded-xl border border-[#2e3b30]">
                      {(['left', 'center', 'right'] as TextAlignId[]).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => updateTheme({ textAlign: align })}
                          className={`py-1.5 rounded-lg text-xs font-semibold uppercase flex items-center justify-center space-x-1 cursor-pointer transition-all ${
                            (currentTheme.textAlign || 'center') === align
                              ? 'bg-[#d4af37] text-[#121613]'
                              : 'text-[#a3b1a5] hover:text-white'
                          }`}
                        >
                          {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                          {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                          {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                          <span className="capitalize text-[11px]">{align === 'left' ? 'Gauche' : align === 'center' ? 'Centré' : 'Droite'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Button Alignment */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Position des Boutons :
                    </label>
                    <div className="grid grid-cols-4 gap-1 p-1 bg-[#121613] rounded-xl border border-[#2e3b30]">
                      {(['left', 'center', 'right', 'stretch'] as ButtonAlignId[]).map((btnAlign) => (
                        <button
                          key={btnAlign}
                          type="button"
                          onClick={() => updateTheme({ buttonAlign: btnAlign })}
                          className={`py-1.5 rounded-lg text-[10px] font-semibold uppercase flex items-center justify-center cursor-pointer transition-all ${
                            (currentTheme.buttonAlign || 'center') === btnAlign
                              ? 'bg-[#d4af37] text-[#121613]'
                              : 'text-[#a3b1a5] hover:text-white'
                          }`}
                          title={btnAlign}
                        >
                          <span>{btnAlign === 'left' ? 'Gauche' : btnAlign === 'center' ? 'Centre' : btnAlign === 'right' ? 'Droite' : 'Plein'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Container Width */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Largeur des Conteneurs :
                    </label>
                    <select
                      value={currentTheme.containerWidth || 'standard'}
                      onChange={(e) => updateTheme({ containerWidth: e.target.value as ContainerWidthId })}
                      className="w-full bg-[#121613] border border-[#2e3b30] text-xs text-[#f3ece0] py-2 px-3 rounded-xl outline-none focus:border-[#d4af37]"
                    >
                      <option value="narrow">Étroit & Intime (1024px)</option>
                      <option value="standard">Standard Équilibré (1280px)</option>
                      <option value="wide">Grand Angle Panorama (1536px)</option>
                    </select>
                  </div>

                  {/* Section Padding / Density */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Densité & Espacement :
                    </label>
                    <select
                      value={currentTheme.contentPadding || 'comfortable'}
                      onChange={(e) => updateTheme({ contentPadding: e.target.value as ContentPaddingId })}
                      className="w-full bg-[#121613] border border-[#2e3b30] text-xs text-[#f3ece0] py-2 px-3 rounded-xl outline-none focus:border-[#d4af37]"
                    >
                      <option value="compact">Compact (Rapide à défiler)</option>
                      <option value="comfortable">Confortable (Recommandé)</option>
                      <option value="spacious">Spacieux & Luxueux</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. PRODUCT PAGE BLOCKS ORDERING (User Requested) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-base text-[#f3ece0] font-semibold flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-[#d4af37]" />
                      <span>Ordre des Objets & Champs de la Fiche Produit (Showcase)</span>
                    </h4>
                    <p className="text-xs text-[#a3b1a5] mt-0.5">
                      Déplacez les éléments avec les flèches ↑ et ↓ pour réorganiser la présentation de chaque veste :
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {(currentTheme.productBlocksOrder || defaultThemeConfig.productBlocksOrder || []).map((blockId, idx, arr) => {
                    const meta = productBlockMeta[blockId] || { name: blockId, icon: '📦', desc: '' };
                    return (
                      <div
                        key={blockId}
                        className="p-3 rounded-xl bg-[#1a221c] border border-[#344437] flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{meta.icon}</span>
                          <div>
                            <span className="text-xs font-serif font-bold text-[#f3ece0]">
                              {idx + 1}. {meta.name}
                            </span>
                            <p className="text-[11px] text-[#a3b1a5]">{meta.desc}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveProductBlock(blockId, 'up')}
                            className="p-1.5 rounded-lg bg-[#253127] hover:bg-[#324235] text-[#d4af37] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Monter"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => handleMoveProductBlock(blockId, 'down')}
                            className="p-1.5 rounded-lg bg-[#253127] hover:bg-[#324235] text-[#d4af37] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Descendre"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. HERO & SHOWCASE FORMATS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#2a362c]">
                {/* Hero Variant */}
                <div className="space-y-3">
                  <h4 className="font-serif text-sm text-[#f3ece0] font-semibold">Format Accueil (Hero)</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'split-cards' as HeroLayoutId, name: 'Duo Cartes Présentation', desc: 'Cartes interactives sous le texte majestueux.' },
                      { id: 'centered-minimal' as HeroLayoutId, name: 'Centré Majestueux & Boutons', desc: 'Slogan épuré et grand bouton d’action.' },
                      { id: 'side-by-side' as HeroLayoutId, name: 'Panorama Asymétrique 2 Colonnes', desc: 'Texte à gauche et modèles à droite façon magazine.' },
                    ].map((h) => (
                      <div
                        key={h.id}
                        onClick={() => updateTheme({ heroLayout: h.id })}
                        className={`p-3 rounded-xl cursor-pointer border transition-all ${
                          (currentTheme.heroLayout || 'split-cards') === h.id
                            ? 'bg-[#212c23] border-[#d4af37]'
                            : 'bg-[#181f19] border-[#2f3d32] hover:border-[#4d6352]'
                        }`}
                      >
                        <div className="font-serif font-bold text-xs text-[#f3ece0]">{h.name}</div>
                        <div className="text-[11px] text-[#a3b1a5] mt-0.5">{h.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Showcase Variant */}
                <div className="space-y-3">
                  <h4 className="font-serif text-sm text-[#f3ece0] font-semibold">Format Showcase (Présentation Vestes)</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'split-interactive' as ShowcaseLayoutId, name: 'Atelier Interactif Split', desc: 'Points cliquables et panneau de personnalisation en direct.' },
                      { id: 'magazine-editorial' as ShowcaseLayoutId, name: 'Éditorial Grand Angle', desc: 'Immersion photo avec 3 colonnes équilibrées.' },
                      { id: 'lookbook-focus' as ShowcaseLayoutId, name: 'Focus Galerie Multi-Angles', desc: 'Mosaïque de prises de vue haute résolution.' },
                    ].map((s) => (
                      <div
                        key={s.id}
                        onClick={() => updateTheme({ showcaseLayout: s.id })}
                        className={`p-3 rounded-xl cursor-pointer border transition-all ${
                          (currentTheme.showcaseLayout || 'split-interactive') === s.id
                            ? 'bg-[#212c23] border-[#d4af37]'
                            : 'bg-[#181f19] border-[#2f3d32] hover:border-[#4d6352]'
                        }`}
                      >
                        <div className="font-serif font-bold text-xs text-[#f3ece0]">{s.name}</div>
                        <div className="text-[11px] text-[#a3b1a5] mt-0.5">{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. SECTION REORDERING & VISIBILITY */}
              <div className="space-y-4 pt-4 border-t border-[#2a362c]">
                <h4 className="font-serif text-base text-[#f3ece0] font-semibold flex items-center justify-between">
                  <span>Ordre & Visibilité des Modules Principaux sur la Page</span>
                </h4>

                <div className="space-y-2">
                  {(currentTheme.sectionOrder || defaultThemeConfig.sectionOrder).map((secId, idx, arr) => {
                    const meta = sectionMeta[secId] || { name: secId, icon: '📄', desc: '' };
                    const isHidden = (currentTheme.hiddenSections || []).includes(secId);

                    return (
                      <div
                        key={secId}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                          isHidden
                            ? 'bg-[#151916] border-[#28322a] opacity-60'
                            : 'bg-[#1c241e] border-[#364539] shadow-md'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{meta.icon}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-serif font-bold text-[#f3ece0]">
                                {idx + 1}. {meta.name}
                              </span>
                              {isHidden && (
                                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/40">
                                  Masqué
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#a3b1a5]">{meta.desc}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSection(secId, 'up')}
                            className="p-2 rounded-xl bg-[#253127] hover:bg-[#324235] text-[#d4af37] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Monter ce bloc"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => handleMoveSection(secId, 'down')}
                            className="p-2 rounded-xl bg-[#253127] hover:bg-[#324235] text-[#d4af37] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Descendre ce bloc"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSectionVisibility(secId)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isHidden
                                ? 'bg-red-950/40 text-red-300 border-red-800/40'
                                : 'bg-[#253127] hover:bg-[#324235] text-[#a3b1a5] border-[#364539]'
                            }`}
                            title={isHidden ? 'Afficher la section' : 'Masquer la section'}
                          >
                            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ARTICLES & CATALOGUE (CRUD: ADD / REMOVE / EDIT)    */}
          {/* ========================================================= */}
          {activeTab === 'articles' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header with Add Button */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#1a221c] border border-[#38483b]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37]">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base text-[#f3ece0] font-bold">
                      Gestion du Catalogue ({formData.jackets.length} article{formData.jackets.length > 1 ? 's' : ''})
                    </h4>
                    <p className="text-xs text-[#a3b1a5]">
                      Ajoutez, supprimez et personnalisez librement vos pièces d'exception.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddNewJacket}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#9c7844] via-[#c6a877] to-[#e4cb9c] text-[#121613] font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg cursor-pointer transition-all"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>+ Ajouter un article</span>
                </button>
              </div>

              {/* Jacket Selector Pills */}
              <div className="flex overflow-x-auto gap-2.5 pb-2">
                {formData.jackets.map((j, idx) => {
                  const isSelected = idx === selectedJacketIndex;
                  return (
                    <button
                      key={j.id || idx}
                      type="button"
                      onClick={() => setSelectedJacketIndex(idx)}
                      className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl border transition-all text-left flex-shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[#222d24] border-[#d4af37] text-[#f3ece0] shadow-lg shadow-[#d4af37]/10'
                          : 'bg-[#161c17] border-[#2f3d32] text-[#a3b1a5] hover:border-[#526a57] hover:text-[#e2d5c3]'
                      }`}
                    >
                      <img
                        src={j.heroImage}
                        alt={j.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#435747]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div>
                        <div className="font-serif font-bold text-xs flex items-center space-x-1.5">
                          <span>{idx + 1}. {j.name}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#d4af37]" />}
                        </div>
                        <div className="text-[11px] text-[#d4af37] font-mono font-bold">
                          {j.price} {j.currency}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Edit Selected Jacket Form */}
              {currentJacket && (
                <div className="p-6 rounded-3xl bg-[#18201a] border border-[#3b4b3e] space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2d3a2f]">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-xs font-bold font-mono">
                        Article #{selectedJacketIndex + 1}
                      </span>
                      <h4 className="font-serif text-lg font-bold text-[#f3ece0]">{currentJacket.name}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteJacket(selectedJacketIndex)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 hover:bg-red-900/60 hover:text-white text-xs font-medium cursor-pointer transition-all"
                      title="Supprimer cet article du catalogue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer cet article</span>
                    </button>
                  </div>

                  {/* Main Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">
                        Nom de la pièce :
                      </label>
                      <input
                        type="text"
                        value={currentJacket.name}
                        onChange={(e) => handleChangeCurrentJacket('name', e.target.value)}
                        className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">
                        Sous-titre / Origine :
                      </label>
                      <input
                        type="text"
                        value={currentJacket.subTitle}
                        onChange={(e) => handleChangeCurrentJacket('subTitle', e.target.value)}
                        className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">
                        Prix (€) :
                      </label>
                      <input
                        type="number"
                        value={currentJacket.price}
                        onChange={(e) => handleChangeCurrentJacket('price', Number(e.target.value))}
                        className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">
                        Catégorie :
                      </label>
                      <input
                        type="text"
                        value={currentJacket.category}
                        onChange={(e) => handleChangeCurrentJacket('category', e.target.value)}
                        className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>

                  {/* Slogan & Descriptions */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                          Slogan de la veste :
                        </label>
                        {currentJacket.tagline && (
                          <button
                            type="button"
                            onClick={() => handleChangeCurrentJacket('tagline', '')}
                            className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer flex items-center space-x-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Supprimer le slogan</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={currentJacket.tagline || ''}
                        onChange={(e) => handleChangeCurrentJacket('tagline', e.target.value)}
                        className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                        placeholder="Ex: L'élégance brute de la haute montagne... (ou laisser vide pour masquer)"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                            Description Courte :
                          </label>
                          {currentJacket.description && (
                            <button
                              type="button"
                              onClick={() => handleChangeCurrentJacket('description', '')}
                              className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer flex items-center space-x-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Effacer</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={currentJacket.description || ''}
                          onChange={(e) => handleChangeCurrentJacket('description', e.target.value)}
                          className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                          placeholder="Description courte de la pièce (ou laisser vide)"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                            Récit & Confection Détaillée :
                          </label>
                          {currentJacket.longDescription && (
                            <button
                              type="button"
                              onClick={() => handleChangeCurrentJacket('longDescription', '')}
                              className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer flex items-center space-x-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Effacer</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={currentJacket.longDescription || ''}
                          onChange={(e) => handleChangeCurrentJacket('longDescription', e.target.value)}
                          className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                          placeholder="Détails de confection, histoire, matières..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Photos & Hero Image Selector */}
                  <div className="space-y-3 pt-4 border-t border-[#2b372d]">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-[#d4af37]" />
                        <span>Photo Principale (Hero Image) :</span>
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={currentJacket.heroImage}
                        onChange={(e) => handleChangeCurrentJacket('heroImage', e.target.value)}
                        className="flex-1 bg-[#121613] border border-[#313f33] text-xs text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                        placeholder="URL de l'image..."
                      />
                      <div className="flex items-center space-x-2">
                        <img
                          src={currentJacket.heroImage}
                          alt="preview"
                          className="w-10 h-10 rounded-xl object-cover border border-[#445647]"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Quick Image Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-[#7d8c7f]">Photos prédéfinies :</span>
                      <div className="flex flex-wrap gap-2">
                        {samplePresetImages.map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleChangeCurrentJacket('heroImage', preset.url)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-[#202922] hover:bg-[#2e3b30] text-[#a3b1a5] hover:text-[#d4af37] border border-[#313e33] cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Colors & Nuances Editor */}
                  <div className="space-y-3 pt-4 border-t border-[#2b372d]">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium flex items-center space-x-2">
                        <Palette className="w-4 h-4 text-[#d4af37]" />
                        <span>Nuances & Couleurs Disponibles :</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="text-xs text-[#d4af37] hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter une couleur</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {currentJacket.colors.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3 rounded-xl bg-[#121613] border border-[#2e3b30] flex items-center space-x-2.5"
                        >
                          <input
                            type="color"
                            value={c.hex}
                            onChange={(e) => handleUpdateColor(cIdx, 'hex', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => handleUpdateColor(cIdx, 'name', e.target.value)}
                            className="flex-1 bg-[#1a221c] border border-[#38483b] text-xs text-white px-2 py-1.5 rounded-lg"
                          />
                          {currentJacket.colors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColor(cIdx)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sizes Management with Checkboxes & Custom Size Terms */}
                  <div className="space-y-3 pt-4 border-t border-[#2b372d]">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium flex items-center space-x-2">
                        <Ruler className="w-4 h-4 text-[#d4af37]" />
                        <span>Tailles Disponibles (Sélection par Coches) :</span>
                      </label>
                      <span className="text-[11px] text-[#a3b1a5]">
                        Actives : <strong className="text-[#d4af37]">{currentJacket.sizes?.length || 0}</strong>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#121613] border border-[#2e3b30] space-y-3">
                      {/* Size Checkbox Grid */}
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set([...customSizesList, ...(currentJacket.sizes || [])])).map((sz) => {
                          const isChecked = currentJacket.sizes?.includes(sz);
                          return (
                            <div
                              key={sz}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-2 ${
                                isChecked
                                  ? 'bg-[#d4af37] text-[#121613] border-[#d4af37] shadow-md font-bold'
                                  : 'bg-[#1e2720] text-[#a3b1a5] border-[#374739] hover:border-[#a3b1a5]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleSize(sz)}
                                className="flex items-center space-x-2 cursor-pointer focus:outline-none"
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] font-bold ${
                                    isChecked
                                      ? 'bg-[#121613] text-[#d4af37] border-[#121613]'
                                      : 'border-[#4a5c4d] bg-[#121613]'
                                  }`}
                                >
                                  {isChecked && '✓'}
                                </span>
                                <span>{sz}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCustomSizeTerm(sz);
                                }}
                                className="text-red-400/70 hover:text-red-300 p-0.5 rounded hover:bg-red-950/60 transition-colors cursor-pointer"
                                title={`Supprimer définitivement la taille "${sz}"`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Custom Size Term */}
                      <div className="pt-2 border-t border-[#263328] flex items-center space-x-2">
                        <input
                          type="text"
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomSizeTerm();
                            }
                          }}
                          placeholder="Ajouter un terme personnalisé (ex: Taille Unique, S/M, 42...)"
                          className="flex-1 bg-[#1a221c] border border-[#38483b] text-xs text-white px-3 py-1.5 rounded-xl outline-none focus:border-[#d4af37]"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSizeTerm}
                          className="px-3 py-1.5 rounded-xl bg-[#28362b] hover:bg-[#354839] border border-[#d4af37]/60 text-[#d4af37] text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter Taille</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hotspots & Points d'Intérêt sur l'Image */}
                  <div className="space-y-3 pt-4 border-t border-[#2b372d]">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium flex items-center space-x-2">
                        <Crosshair className="w-4 h-4 text-[#d4af37]" />
                        <span>Points Interactifs / Hotspots sur la Photo ({currentJacket.hotspots?.length || 0}) :</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddHotspot}
                        className="text-xs text-[#d4af37] hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter un Point</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(currentJacket.hotspots || []).map((spot, hIdx) => (
                        <div
                          key={spot.id || hIdx}
                          className="p-3.5 rounded-2xl bg-[#121613] border border-[#2e3b30] space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-[#253227] pb-2">
                            <span className="text-xs font-semibold text-[#d4af37] flex items-center space-x-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>Point #{hIdx + 1} — {spot.title}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteHotspot(spot.id)}
                              className="text-red-400 hover:text-red-300 text-xs flex items-center space-x-1 cursor-pointer"
                              title="Supprimer ce point"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Supprimer</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2 space-y-2">
                              <div>
                                <span className="text-[10px] text-[#a3b1a5] uppercase block mb-1">Titre du Point :</span>
                                <input
                                  type="text"
                                  value={spot.title}
                                  onChange={(e) => handleUpdateHotspot(spot.id, 'title', e.target.value)}
                                  className="w-full bg-[#1a221c] border border-[#38483b] text-xs text-white px-3 py-1.5 rounded-xl outline-none focus:border-[#d4af37]"
                                  placeholder="Ex: Col Montant Doublé..."
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-[#a3b1a5] uppercase block mb-1">Description explicative :</span>
                                <textarea
                                  rows={2}
                                  value={spot.description}
                                  onChange={(e) => handleUpdateHotspot(spot.id, 'description', e.target.value)}
                                  className="w-full bg-[#1a221c] border border-[#38483b] text-xs text-white px-3 py-1.5 rounded-xl outline-none focus:border-[#d4af37]"
                                  placeholder="Ex: Protection thermique optimale contre le vent..."
                                />
                              </div>
                            </div>

                            <div className="space-y-2 bg-[#18201a] p-2.5 rounded-xl border border-[#2a382d]">
                              <span className="text-[10px] text-[#d4af37] uppercase font-bold block mb-1">Position sur l'image :</span>
                              <div>
                                <span className="text-[10px] text-[#a3b1a5] block">Horizontale X ({spot.x}%) :</span>
                                <input
                                  type="range"
                                  min="5"
                                  max="95"
                                  value={spot.x}
                                  onChange={(e) => handleUpdateHotspot(spot.id, 'x', parseInt(e.target.value) || 50)}
                                  className="w-full accent-[#d4af37] cursor-pointer"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-[#a3b1a5] block">Verticale Y ({spot.y}%) :</span>
                                <input
                                  type="range"
                                  min="5"
                                  max="95"
                                  value={spot.y}
                                  onChange={(e) => handleUpdateHotspot(spot.id, 'y', parseInt(e.target.value) || 50)}
                                  className="w-full accent-[#d4af37] cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(!currentJacket.hotspots || currentJacket.hotspots.length === 0) && (
                        <div className="text-center py-4 px-3 rounded-xl bg-[#121613] border border-dashed border-[#2d3a2e] text-xs text-[#a3b1a5]">
                          Aucun point interactif configuré pour cet article. Cliquez sur "Ajouter un Point" pour en créer un.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Technical Specs Editor */}
                  <div className="space-y-3 pt-4 border-t border-[#2b372d]">
                    <label className="block text-xs uppercase tracking-widest text-[#d4af37] font-medium">
                      Caractéristiques Techniques & Confection :
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[11px] text-[#a3b1a5] block mb-1">Origine :</span>
                        <input
                          type="text"
                          value={currentJacket.specs?.origin || ''}
                          onChange={(e) => handleChangeCurrentJacketSpecs('origin', e.target.value)}
                          className="w-full bg-[#121613] border border-[#313f33] text-xs text-white px-3 py-1.5 rounded-lg"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[#a3b1a5] block mb-1">Indice de Chaleur :</span>
                        <input
                          type="text"
                          value={currentJacket.specs?.warmthRating || ''}
                          onChange={(e) => handleChangeCurrentJacketSpecs('warmthRating', e.target.value)}
                          className="w-full bg-[#121613] border border-[#313f33] text-xs text-white px-3 py-1.5 rounded-lg"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[#a3b1a5] block mb-1">Imperméabilité :</span>
                        <input
                          type="text"
                          value={currentJacket.specs?.waterResistance || ''}
                          onChange={(e) => handleChangeCurrentJacketSpecs('waterResistance', e.target.value)}
                          className="w-full bg-[#121613] border border-[#313f33] text-xs text-white px-3 py-1.5 rounded-lg"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[#a3b1a5] block mb-1">Poids :</span>
                        <input
                          type="text"
                          value={currentJacket.specs?.weight || ''}
                          onChange={(e) => handleChangeCurrentJacketSpecs('weight', e.target.value)}
                          className="w-full bg-[#121613] border border-[#313f33] text-xs text-white px-3 py-1.5 rounded-lg"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[#a3b1a5] block mb-1">Coupe :</span>
                        <input
                          type="text"
                          value={currentJacket.specs?.fitType || ''}
                          onChange={(e) => handleChangeCurrentJacketSpecs('fitType', e.target.value)}
                          className="w-full bg-[#121613] border border-[#313f33] text-xs text-white px-3 py-1.5 rounded-lg"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[#a3b1a5] block mb-1">Entretien :</span>
                        <input
                          type="text"
                          value={currentJacket.specs?.care || ''}
                          onChange={(e) => handleChangeCurrentJacketSpecs('care', e.target.value)}
                          className="w-full bg-[#121613] border border-[#313f33] text-xs text-white px-3 py-1.5 rounded-lg"
                        />
                      </div>

                      {/* Custom Added Comparison Criteria */}
                      {activeCriteria
                        .filter((c) => !['category', 'fabric', 'warmth', 'water', 'weight', 'fit', 'care', 'price'].includes(c.key))
                        .map((crit) => (
                          <div key={crit.id}>
                            <span className="text-[11px] text-[#d4af37] font-semibold block mb-1">
                              {crit.label} :
                            </span>
                            <input
                              type="text"
                              value={currentJacket.customSpecs?.[crit.key] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => {
                                  const jackets = [...prev.jackets];
                                  const curr = jackets[selectedJacketIndex];
                                  if (curr) {
                                    jackets[selectedJacketIndex] = {
                                      ...curr,
                                      customSpecs: {
                                        ...(curr.customSpecs || {}),
                                        [crit.key]: val,
                                      },
                                    };
                                  }
                                  return { ...prev, jackets };
                                });
                              }}
                              placeholder={`Valeur pour ${crit.label}...`}
                              className="w-full bg-[#121613] border border-[#d4af37]/40 text-xs text-white px-3 py-1.5 rounded-lg focus:border-[#d4af37]"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: CUSTOM LABELS, TAB TITLES & COMPARISON CRITERIA    */}
          {/* ========================================================= */}
          {activeTab === 'labels' && (
            <div className="space-y-8 animate-fadeIn">
              {/* SECTION: TAB NAVIGATION ORDER */}
              <div className="p-5 rounded-2xl bg-[#1a221c] border border-[#3c4c3f] space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 text-[#d4af37]">
                      <Move className="w-5 h-5" />
                      <h4 className="font-serif text-base font-bold text-[#f3ece0]">Ordre des onglets de navigation</h4>
                    </div>
                    <p className="text-xs text-[#a3b1a5] mt-1">Glisse les onglets pour changer leur ordre dans la Navbar. Le bloc correspondant reste le même.</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-[#87968a]">Glisser-déposer</span>
                </div>

                <div className="space-y-2">
                  {navOrder.map((navId, idx) => {
                    const isHidden = (currentTheme.hiddenSections || []).includes(navId as SectionId);
                    const isDragTarget = dragOverNavId === navId && draggedNavId !== navId;
                    return (
                      <div
                        key={navId}
                        draggable
                        onDragStart={(e) => {
                          setDraggedNavId(navId);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', navId);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverNavId(navId);
                        }}
                        onDragLeave={() => setDragOverNavId((current) => current === navId ? null : current)}
                        onDrop={(e) => {
                          e.preventDefault();
                          const sourceId = (e.dataTransfer.getData('text/plain') || draggedNavId) as NavigationId | null;
                          if (sourceId) moveNavItem(sourceId, navId);
                          setDraggedNavId(null);
                          setDragOverNavId(null);
                        }}
                        onDragEnd={() => {
                          setDraggedNavId(null);
                          setDragOverNavId(null);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                          isDragTarget
                            ? 'border-[#d4af37] bg-[#283528] translate-y-[-1px]'
                            : isHidden
                              ? 'border-[#28322a] bg-[#151916] opacity-60'
                              : 'border-[#364539] bg-[#1c241e] hover:border-[#536653]'
                        }`}
                      >
                        <GripVertical className="w-5 h-5 shrink-0 text-[#87968a]" />
                        <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-[#253127] text-xs text-[#d4af37]">{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-serif font-bold text-sm text-[#f3ece0] truncate">{navLabelMap[navId]}</div>
                          <div className="text-[10px] text-[#87968a] mt-0.5">Bloc : #{navId}{isHidden ? ' • Masqué' : ''}</div>
                        </div>
                        {isHidden && (
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/40">Masqué</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: TAB NAVIGATION TITLES */}
              <div className="p-5 rounded-2xl bg-[#1a221c] border border-[#3c4c3f] space-y-4">
                <div className="flex items-center space-x-2 text-[#d4af37]">
                  <SlidersHorizontal className="w-5 h-5" />
                  <h4 className="font-serif text-base font-bold text-[#f3ece0]">
                    Titres & Libellés des Onglets du Site
                  </h4>
                </div>
                <p className="text-xs text-[#a3b1a5]">
                  Personnalisez les intitulés affichés dans le menu de navigation haut et dans les en-têtes de sections.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1.5 font-medium">
                      Onglet Modèles & Collection :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.collectionTabLabel || 'Les 2 Vestes'}
                      onChange={(e) => updateTheme({ collectionTabLabel: e.target.value })}
                      placeholder="Ex: Les 2 Vestes"
                      className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1.5 font-medium">
                      Onglet Tableau Comparatif :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.comparatifTabLabel || 'Tableau Comparatif des Vestes'}
                      onChange={(e) => updateTheme({ comparatifTabLabel: e.target.value })}
                      placeholder="Ex: Tableau Comparatif des Vestes"
                      className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1.5 font-medium">
                      Onglet Histoire & Origines :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.originesTabLabel || 'L’Esprit Pyrénées'}
                      onChange={(e) => updateTheme({ originesTabLabel: e.target.value })}
                      placeholder="Ex: L’Esprit Pyrénées"
                      className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1.5 font-medium">
                      Onglet Lookbook / Galerie :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.lookbookTabLabel || 'Lookbook'}
                      onChange={(e) => updateTheme({ lookbookTabLabel: e.target.value })}
                      placeholder="Ex: Lookbook"
                      className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1.5 font-medium">
                      Onglet Contact & Atelier :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.contactTabLabel || 'Contact & Atelier'}
                      onChange={(e) => updateTheme({ contactTabLabel: e.target.value })}
                      placeholder="Ex: Contact & Atelier"
                      className="w-full bg-[#121613] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: COMPARISON TABLE CRITERIA MANAGER */}
              <div className="p-5 rounded-2xl bg-[#1a221c] border border-[#3c4c3f] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <Scale className="w-5 h-5" />
                    <h4 className="font-serif text-base font-bold text-[#f3ece0]">
                      Gestion des Critères Techniques du Tableau Comparatif
                    </h4>
                  </div>
                  <span className="text-xs text-[#a3b1a5]">
                    Total : <strong className="text-[#d4af37]">{activeCriteria.length}</strong> critères
                  </span>
                </div>
                <p className="text-xs text-[#a3b1a5]">
                  Ajoutez, modifiez le nom ou supprimez les critères techniques affichés dans les lignes du tableau comparatif des vestes.
                </p>

                {/* Criteria Items List */}
                <div className="space-y-2.5">
                  {activeCriteria.map((crit, idx) => (
                    <div
                      key={crit.id}
                      className="flex items-center space-x-3 p-3 rounded-xl bg-[#121613] border border-[#2e3b30]"
                    >
                      <span className="w-6 text-center text-xs font-mono text-[#d4af37] font-bold">#{idx + 1}</span>
                      <input
                        type="text"
                        value={crit.label}
                        onChange={(e) => handleUpdateCriterionLabel(crit.id, e.target.value)}
                        className="flex-1 bg-[#1a221c] border border-[#38483b] text-xs text-white px-3 py-1.5 rounded-lg outline-none focus:border-[#d4af37]"
                        placeholder="Intitulé du critère..."
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteCriterion(crit.id)}
                        className="p-1.5 rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-white text-xs cursor-pointer transition-colors flex items-center space-x-1"
                        title="Supprimer ce critère"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Supprimer</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Criterion Input */}
                <div className="flex items-center space-x-2 pt-2 border-t border-[#2a362c]">
                  <input
                    type="text"
                    value={newCriterionLabel}
                    onChange={(e) => setNewCriterionLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCriterionLabel.trim()) {
                          handleAddCriterion(newCriterionLabel.trim());
                          setNewCriterionLabel('');
                        }
                      }
                    }}
                    placeholder="Nouveau critère technique (ex: Doublure intérieure, Garantie, Respirabilité...)"
                    className="flex-1 bg-[#121613] border border-[#38483b] text-xs text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCriterionLabel.trim()) {
                        handleAddCriterion(newCriterionLabel.trim());
                        setNewCriterionLabel('');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#28362b] border border-[#d4af37] text-[#d4af37] hover:bg-[#344638] text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter Critère</span>
                  </button>
                </div>
              </div>

              {/* BUTTON & BADGE LABELS */}
              <div className="p-5 rounded-2xl bg-[#1a221c] border border-[#3c4c3f] space-y-4">
                <div className="flex items-center space-x-2 text-[#d4af37]">
                  <Type className="w-5 h-5" />
                  <h4 className="font-serif text-base font-bold text-[#f3ece0]">
                    Personnalisation des Textes & Libellés des Boutons
                  </h4>
                </div>
                <p className="text-xs text-[#a3b1a5]">
                  Ajustez les textes d'appel à l'action affichés dans l'ensemble de votre boutique.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Texte Bouton Commande Rapide :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.orderButtonText || 'Commander'}
                      onChange={(e) => updateTheme({ orderButtonText: e.target.value })}
                      className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                      placeholder="Ex: Commander, Réserver..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Texte Bouton Découverte :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.discoverButtonText || 'Découvrir'}
                      onChange={(e) => updateTheme({ discoverButtonText: e.target.value })}
                      className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                      placeholder="Ex: Découvrir, Explorer..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Texte Bouton Sur-Mesure :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.inquiryButtonText || 'Commander sur Mesure'}
                      onChange={(e) => updateTheme({ inquiryButtonText: e.target.value })}
                      className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                      placeholder="Ex: Commander sur Mesure..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Texte Bouton Atelier (Pied de Page) :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.workshopButtonText || "Prendre Rendez-vous à l'Atelier"}
                      onChange={(e) => updateTheme({ workshopButtonText: e.target.value })}
                      className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                      placeholder="Ex: Prendre Rendez-vous à l'Atelier..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Badge de Sous-Titre Accueil (Haut de page) :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.heroBadgeText || 'Édition Limitée des Pyrénées'}
                      onChange={(e) => updateTheme({ heroBadgeText: e.target.value })}
                      className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                      placeholder="Ex: Édition Limitée des Pyrénées..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Surtitre d'Accueil (Italique au-dessus du nom) :
                    </label>
                    <input
                      type="text"
                      value={currentTheme.heroTitlePrefix || 'Thème Champêtre & Élégance'}
                      onChange={(e) => updateTheme({ heroTitlePrefix: e.target.value })}
                      className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                      placeholder="Ex: Thème Champêtre & Élégance..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: BRAND IDENTITY & STORY                             */}
          {/* ========================================================= */}
          {activeTab === 'brand' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                      Nom de la Maison :
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.brandName || ''}
                    onChange={(e) => handleChangeBrand('brandName', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                      Slogan Principal :
                    </label>
                    {formData.tagline && (
                      <button
                        type="button"
                        onClick={() => handleChangeBrand('tagline', '')}
                        className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => handleChangeBrand('tagline', e.target.value)}
                    placeholder="Slogan principal (ou laisser vide)"
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                      Sous-titre / Description de Présentation :
                    </label>
                    {formData.subtitle && (
                      <button
                        type="button"
                        onClick={() => handleChangeBrand('subtitle', '')}
                        className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={formData.subtitle || ''}
                    onChange={(e) => handleChangeBrand('subtitle', e.target.value)}
                    placeholder="Sous-titre ou présentation (ou laisser vide)"
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                      Lieu de l'Atelier / Conception :
                    </label>
                    {formData.designerLocation && (
                      <button
                        type="button"
                        onClick={() => handleChangeBrand('designerLocation', '')}
                        className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.designerLocation || ''}
                    onChange={(e) => handleChangeBrand('designerLocation', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Email de Contact Général :
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => handleChangeBrand('contactEmail', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-[#141b16] border border-[#344437] space-y-2">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <ShoppingBag className="w-4 h-4" />
                    <label className="text-xs uppercase tracking-widest font-bold">
                      Email Destinataire des Commandes & Réservations :
                    </label>
                  </div>
                  <p className="text-[11px] text-[#a3b1a5]">
                    Toutes les réservations, demandes sur mesure et commandes passées par les clients sur le site seront dirigées vers cette adresse :
                  </p>
                  <input
                    type="email"
                    required
                    value={formData.ordersEmail || ''}
                    onChange={(e) => handleChangeBrand('ordersEmail', e.target.value)}
                    placeholder="ex: contact@maisondespyrenees.fr"
                    className="w-full bg-[#1b231d] border border-[#435747] text-sm text-[#f3ece0] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#2a362c]">
                <h4 className="font-serif text-sm uppercase tracking-widest text-[#d4af37] font-semibold">
                  Récit de Création & Terroir
                </h4>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                      Titre du Récit :
                    </label>
                    {formData.storyTitle && (
                      <button
                        type="button"
                        onClick={() => handleChangeBrand('storyTitle', '')}
                        className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.storyTitle || ''}
                    onChange={(e) => handleChangeBrand('storyTitle', e.target.value)}
                    placeholder="Titre du récit de marque (ou laisser vide)"
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                        Paragraphe 1 :
                      </label>
                      {formData.storyText1 && (
                        <button
                          type="button"
                          onClick={() => handleChangeBrand('storyText1', '')}
                          className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                        >
                          Effacer le texte
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={formData.storyText1 || ''}
                      onChange={(e) => handleChangeBrand('storyText1', e.target.value)}
                      placeholder="Premier paragraphe du récit (ou laisser vide)"
                      className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                        Paragraphe 2 :
                      </label>
                      {formData.storyText2 && (
                        <button
                          type="button"
                          onClick={() => handleChangeBrand('storyText2', '')}
                          className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                        >
                          Effacer le texte
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={formData.storyText2 || ''}
                      onChange={(e) => handleChangeBrand('storyText2', e.target.value)}
                      placeholder="Second paragraphe du récit (ou laisser vide)"
                      className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: SECURITY & EMAILS                                  */}
          {/* ========================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-6 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-4">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold flex items-center space-x-2">
                  <Key className="w-5 h-5 text-[#d4af37]" />
                  <span>Compte Administrateur & Email de Récupération</span>
                </h4>

                <p className="text-xs text-[#a3b1a5]">
                  Associez votre adresse email pour vous connecter directement et recevoir votre code de réinitialisation de mot de passe en cas d'oubli.
                </p>

                {securityMessage && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                      securityMessage.type === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-200'
                        : 'bg-red-950/60 border border-red-700 text-red-200'
                    }`}
                  >
                    <span>{securityMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateCredentials} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">
                        Identifiant Admin :
                      </label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full bg-[#121613] border border-[#364438] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#d4af37] mb-1 font-bold flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email de Récupération :</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="contact@maisondespyrenees.fr"
                        className="w-full bg-[#121613] border border-[#d4af37]/60 text-sm text-[#f3ece0] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#121613] border border-[#2c382e] space-y-3">
                    <div className="flex items-center space-x-2 text-[#d4af37]">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-serif font-bold uppercase tracking-wider">
                        Sécurité Serveur Vercel Active
                      </span>
                    </div>
                    <p className="text-xs text-[#a3b1a5]">
                      Le mot de passe administrateur principal est géré de façon 100% sécurisée sur Vercel via la variable d'environnement <code className="text-[#d4af37] bg-black/40 px-1.5 py-0.5 rounded font-mono">Admin</code>. Aucun mot de passe en clair n'est présent dans le code source React.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] text-[#a3b1a5] mb-1">Mot de passe de sécurité :</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Autorisation"
                          className="w-full bg-[#18201a] border border-[#364438] text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#a3b1a5] mb-1">Nouveau mot de passe :</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nouveau"
                          className="w-full bg-[#18201a] border border-[#364438] text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#a3b1a5] mb-1">Confirmation :</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirmation"
                          className="w-full bg-[#18201a] border border-[#364438] text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#28362b] border border-[#d4af37] text-[#d4af37] hover:bg-[#344638] text-xs uppercase font-bold tracking-wider cursor-pointer transition-all"
                  >
                    Enregistrer les informations administrateur
                  </button>

                  {/* Email Password & Reset Request Block */}
                  <div className="mt-4 pt-4 border-t border-[#2a362c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#121613] p-4 rounded-xl border border-[#2e3b30]">
                    <div>
                      <span className="text-xs font-semibold text-[#d4af37] block">
                        Gestion Sécurisée Vercel :
                      </span>
                      <p className="text-[11px] text-[#a3b1a5] mt-0.5">
                        Pour modifier le mot de passe administrateur principal, mettez à jour la variable <code className="text-[#d4af37] bg-black/40 px-1 py-0.5 rounded font-mono">Admin</code> dans votre tableau de bord Vercel.
                      </p>
                    </div>
                  </div>
                </form>
              </div>

              {/* Destination Email for Orders */}
              <div className="p-6 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-3">
                <div className="flex items-center space-x-2 text-[#d4af37]">
                  <ShoppingBag className="w-5 h-5" />
                  <h4 className="font-serif text-base font-bold text-[#f3ece0]">
                    Email Destinataire des Commandes & Réservations Clients
                  </h4>
                </div>
                <p className="text-xs text-[#a3b1a5]">
                  Adresse recevant les notifications de commande envoyées depuis le site :
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                  <input
                    type="email"
                    value={formData.ordersEmail || ''}
                    onChange={(e) => handleChangeBrand('ordersEmail', e.target.value)}
                    placeholder="contact@maisondespyrenees.fr"
                    className="flex-1 bg-[#121613] border border-[#435747] text-sm text-[#f3ece0] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Les réservations et commandes seront expédiées à ${formData.ordersEmail || 'l\'adresse par défaut'}.`);
                    }}
                    className="px-4 py-2.5 bg-[#253227] text-xs text-[#d4af37] border border-[#445847] hover:border-[#d4af37] rounded-xl cursor-pointer"
                  >
                    Vérifier
                  </button>
                </div>
              </div>

              {/* Export / Import */}
              <div className="p-6 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-4">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold flex items-center space-x-2">
                  <Download className="w-5 h-5 text-[#d4af37]" />
                  <span>Sauvegarde & Exportation JSON du Site</span>
                </h4>
                <p className="text-xs text-[#a3b1a5]">
                  Exportez l'intégralité de vos articles, textes, photos, modèles et personnalisations dans un fichier JSON pour sauvegarder ou restaurer.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handleExportConfig}
                    className="px-4 py-2.5 rounded-xl bg-[#232e26] border border-[#435747] hover:border-[#d4af37] text-xs text-[#f3ece0] font-medium flex items-center space-x-2 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4 text-[#d4af37]" />
                    <span>Télécharger la Sauvegarde (.JSON)</span>
                  </button>

                  <label className="px-4 py-2.5 rounded-xl bg-[#232e26] border border-[#435747] hover:border-[#d4af37] text-xs text-[#f3ece0] font-medium flex items-center space-x-2 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-[#d4af37]" />
                    <span>Restaurer / Importer un Fichier JSON</span>
                    <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Voulez-vous réinitialiser toutes les modifications au design initial ?')) {
                        onReset();
                        onClose();
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-red-300 hover:bg-red-900/50 flex items-center space-x-1.5 cursor-pointer ml-auto transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser par Défaut</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: GITHUB & DEPLOYMENT GUIDE                          */}
          {/* ========================================================= */}
          {activeTab === 'github' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-6 rounded-2xl bg-[#1a221c] border border-[#d4af37]/40 space-y-3">
                <div className="flex items-center space-x-3 text-[#d4af37]">
                  <GitBranch className="w-6 h-6" />
                  <h4 className="font-serif text-lg font-bold text-[#f3ece0]">
                    Exporter et Héberger Gratuitement votre Site sur GitHub
                  </h4>
                </div>
                <p className="text-xs text-[#dcd2c4] leading-relaxed">
                  Votre projet est 100% autonome et propriétaire. Tous vos fichiers (code source, dossier <code className="text-[#d4af37]">src/assets</code>, configuration) sont prêts à être importés sur votre compte <strong>GitHub</strong>, puis connectés à <strong>Vercel</strong>, <strong>Netlify</strong> ou <strong>GitHub Pages</strong>.
                </p>
              </div>

              {/* Commands */}
              <div className="p-6 rounded-2xl bg-[#141a15] border border-[#364538] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <Terminal className="w-5 h-5" />
                    <span className="font-serif text-sm uppercase tracking-widest font-semibold text-[#f3ece0]">
                      Commandes Git pour importer sur votre GitHub :
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "1. Initialiser le dépôt Git local", cmd: "git init" },
                    { label: "2. Ajouter tous les fichiers du projet", cmd: "git add ." },
                    { label: "3. Créer le commit initial", cmd: 'git commit -m "Maison des Pyrénées - Site Vitrine & Panneau Admin"' },
                    { label: "4. Définir la branche principale en 'main'", cmd: "git branch -M main" },
                    { label: "5. Lier votre dépôt GitHub distant (remplacez par l'URL de votre dépôt)", cmd: "git remote add origin https://github.com/VOTRE-NOM-UTILISATEUR/votre-depot-pyrenees.git" },
                    { label: "6. Envoyer le code sur GitHub", cmd: "git push -u origin main" },
                  ].map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#1b221d] border border-[#2c392e] space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[#a3b1a5]">
                        <span className="font-medium text-[#d4af37]">{step.label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(step.cmd);
                            setCopiedIndex(idx);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          }}
                          className="flex items-center space-x-1 text-[11px] text-[#a3b1a5] hover:text-[#d4af37] px-2 py-0.5 rounded bg-[#253027] transition-colors cursor-pointer"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs font-mono text-[#e2d5c3] bg-[#111612] px-3 py-2 rounded-lg overflow-x-auto select-all">
                        {step.cmd}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hosting Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-3">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <Globe className="w-5 h-5" />
                    <h5 className="font-serif font-bold text-sm text-[#f3ece0]">Option A: Vercel (Recommandé)</h5>
                  </div>
                  <ul className="text-xs text-[#a3b1a5] space-y-1.5 list-disc list-inside">
                    <li>Gratuit à vie</li>
                    <li>Connexion directe en 1 clic</li>
                    <li>Détection auto Vite / React</li>
                    <li>Déploiement continu</li>
                  </ul>
                  <span className="inline-block text-[11px] font-mono text-[#d4af37] bg-black/40 px-2 py-1 rounded">
                    vercel.com/new
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-3">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <Globe className="w-5 h-5" />
                    <h5 className="font-serif font-bold text-sm text-[#f3ece0]">Option B: Netlify</h5>
                  </div>
                  <ul className="text-xs text-[#a3b1a5] space-y-1.5 list-disc list-inside">
                    <li>Gratuit & très rapide</li>
                    <li>Build : <code className="text-[#f3ece0]">npm run build</code></li>
                    <li>Publish : <code className="text-[#f3ece0]">dist</code></li>
                    <li>SSL automatique inclus</li>
                  </ul>
                  <span className="inline-block text-[11px] font-mono text-[#d4af37] bg-black/40 px-2 py-1 rounded">
                    app.netlify.com
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-3">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <Globe className="w-5 h-5" />
                    <h5 className="font-serif font-bold text-sm text-[#f3ece0]">Option C: GitHub Pages</h5>
                  </div>
                  <ul className="text-xs text-[#a3b1a5] space-y-1.5 list-disc list-inside">
                    <li>Intégré à votre dépôt GitHub</li>
                    <li>Activé via Réglages &gt; Pages</li>
                    <li>Build automatique avec GitHub Actions</li>
                  </ul>
                  <span className="inline-block text-[11px] font-mono text-[#d4af37] bg-black/40 px-2 py-1 rounded">
                    Settings &gt; Pages
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="font-serif font-bold text-sm text-[#f3ece0]">
                    Téléchargement des Fichiers de Configuration
                  </h5>
                  <p className="text-xs text-[#a3b1a5]">
                    Conservez votre configuration au format JSON pour l'embarquer avec votre dépôt GitHub.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportConfig}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9c7844] to-[#d4af37] text-[#121613] font-bold text-xs uppercase tracking-wider flex items-center space-x-2 hover:brightness-110 shadow-lg cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter la Config JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-4 bg-[#18201a] border-t border-[#2b372d] flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase tracking-wider text-[#a3b1a5] hover:text-white rounded-xl bg-[#202922] cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#9c7844] via-[#c6a877] to-[#e4cb9c] text-[#121613] font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 shadow-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer toutes les modifications</span>
          </button>
        </div>
      </div>
    </div>
  );
};
