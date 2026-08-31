import React, { useEffect, useState } from 'react';
import { ComparisonCriterion, JacketModel, JacketAvailabilityStatus } from '../types';
import { prepareImageForUpload } from '../utils/mediaUpload';
import { getProductAvailabilityStatus, getProductStatusLabel } from '../utils/productStatus';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Package,
  Save,
  Tag,
  DollarSign,
  Palette,
  Maximize2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  Minus,
  Crosshair,
  Ruler,
  Shield,
  Feather,
  CloudRain,
  GripVertical
} from 'lucide-react';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: JacketModel[];
  onRefreshProducts: () => void;
  embedded?: boolean;
  deferServerSave?: boolean;
  onProductsChange?: (products: JacketModel[]) => void;
  technicalCriteria?: ComparisonCriterion[];
  initialProductId?: string;
  categoryOptions?: string[];
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
  embedded = false,
  deferServerSave = false,
  onProductsChange,
  technicalCriteria = [],
  initialProductId,
  categoryOptions = [],
}) => {
  const [draftProducts, setDraftProducts] = useState<JacketModel[]>(() => JSON.parse(JSON.stringify(products || [])));
  const [editingProduct, setEditingProduct] = useState<Partial<JacketModel> | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<'primary' | 'secondary'>('primary');
  const [uploadingImage, setUploadingImage] = useState<'primary' | number | null>(null);
  const [editingHotspotIndex, setEditingHotspotIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const nextProducts = JSON.parse(JSON.stringify(products || []));
      setDraftProducts(nextProducts);
      if (initialProductId) {
        const initialProduct = nextProducts.find((product: JacketModel) => product.id === initialProductId);
        if (initialProduct) {
          setEditingProduct(syncProductGallery(initialProduct));
          setIsCreating(false);
          setImageTab('primary');
        }
      }
    }
  }, [isOpen, products, initialProductId]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getSecondaryImages = (product: Partial<JacketModel>) => {
    const gallery = Array.isArray(product.gallery) ? product.gallery : [];
    const hero = String(product.heroImage || gallery[0] || '').trim();
    return gallery
      .map((url) => String(url || '').trim())
      .filter((url) => url !== hero);
  };

  const syncProductGallery = (product: Partial<JacketModel>, heroImage?: string, secondaryImages?: string[]) => {
    // heroImage reste la source de vérité de l'image principale.
    // gallery ne sert qu'à stocker la galerie secondaire autour de cette image.
    const existingHero = String(product.heroImage || '').trim();
    const galleryPrimary = Array.isArray(product.gallery) ? String(product.gallery[0] || '').trim() : '';
    const hero = String(heroImage !== undefined ? heroImage : (existingHero || galleryPrimary || '')).trim();
    const secondary = (secondaryImages ?? getSecondaryImages({ ...product, heroImage: hero }))
      .map((url) => String(url || '').trim())
      .filter(Boolean)
      .filter((url) => url !== hero);

    return {
      ...product,
      heroImage: hero,
      gallery: Array.from(new Set([hero, ...secondary].filter(Boolean))),
    };
  };

  const handleHeroImageChange = (value: string) => {
    setEditingProduct((current) => current ? syncProductGallery(current, value) : current);
  };

  const handleSecondaryImageChange = (index: number, value: string) => {
    setEditingProduct((current) => {
      if (!current) return current;
      const secondary = getSecondaryImages(current);
      secondary[index] = value;
      return syncProductGallery(current, undefined, secondary);
    });
  };

  const handleAddSecondaryImage = () => {
    setEditingProduct((current) => {
      if (!current) return current;
      const hero = String(current.heroImage || (Array.isArray(current.gallery) ? current.gallery[0] : '') || '').trim();
      const secondary = getSecondaryImages(current);
      return { ...current, heroImage: hero, gallery: [hero, ...secondary, ''] };
    });
    setImageTab('secondary');
  };

  const handleDeleteSecondaryImage = (index: number) => {
    setEditingProduct((current) => {
      if (!current) return current;
      const secondary = getSecondaryImages(current);
      secondary.splice(index, 1);
      return syncProductGallery(current, undefined, secondary);
    });
  };

  const uploadProductImage = async (file: File, target: 'primary' | number) => {
    setUploadingImage(target);
    try {
      const preparedFile = await prepareImageForUpload(file);
      const form = new FormData();
      form.append('file', preparedFile);

      const response = await fetch('/api/site-media', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        body: form,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || `Upload image : HTTP ${response.status}`);
      }

      if (target === 'primary') {
        handleHeroImageChange(String(data.url));
      } else {
        handleSecondaryImageChange(target, String(data.url));
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Impossible d’importer cette image.');
    } finally {
      setUploadingImage(null);
    }
  };

  const updateEditingProduct = (patch: Partial<JacketModel>) => {
    setEditingProduct((current) => current ? { ...current, ...patch } : current);
  };

  const updateColor = (index: number, field: 'name' | 'hex', value: string) => {
    setEditingProduct((current) => {
      if (!current) return current;
      const colors = Array.isArray(current.colors) ? [...current.colors] : [];
      if (!colors[index]) return current;
      colors[index] = { ...colors[index], [field]: value };
      return { ...current, colors };
    });
  };

  const addColor = () => {
    setEditingProduct((current) => current ? {
      ...current,
      colors: [...(current.colors || []), { name: 'Nouvelle Nuance', hex: '#526355' }],
    } : current);
  };

  const deleteColor = (index: number) => {
    setEditingProduct((current) => {
      if (!current) return current;
      const colors = [...(current.colors || [])];
      if (colors.length <= 1) return current;
      colors.splice(index, 1);
      return { ...current, colors };
    });
  };

  const toggleSize = (size: string) => {
    setEditingProduct((current) => {
      if (!current) return current;
      const sizes = [...(current.sizes || [])];
      const index = sizes.indexOf(size);
      if (index >= 0) sizes.splice(index, 1);
      else sizes.push(size);
      return { ...current, sizes };
    });
  };

  const addSize = (size: string) => {
    const value = size.trim();
    if (!value) return;
    setEditingProduct((current) => {
      if (!current) return current;
      const sizes = Array.from(new Set([...(current.sizes || []), value]));
      return { ...current, sizes };
    });
  };

  const deleteSize = (index: number) => {
    setEditingProduct((current) => {
      if (!current) return current;
      const sizes = [...(current.sizes || [])];
      sizes.splice(index, 1);
      return { ...current, sizes };
    });
  };

  const addFeature = () => {
    setEditingProduct((current) => current ? {
      ...current,
      features: [...(current.features || []), { iconName: 'Shield', title: 'Nouvel atout', desc: '' }],
    } : current);
  };

  const updateFeature = (index: number, field: 'iconName' | 'title' | 'desc', value: string) => {
    setEditingProduct((current) => {
      if (!current) return current;
      const features = [...(current.features || [])];
      if (!features[index]) return current;
      features[index] = { ...features[index], [field]: value };
      return { ...current, features };
    });
  };

  const deleteFeature = (index: number) => {
    setEditingProduct((current) => {
      if (!current) return current;
      const features = [...(current.features || [])];
      features.splice(index, 1);
      return { ...current, features };
    });
  };

  const addHotspot = () => {
    setEditingProduct((current) => current ? {
      ...current,
      hotspots: [...(current.hotspots || []), {
        id: `hotspot-${Date.now()}`,
        title: 'Nouveau point',
        description: '',
        x: 50,
        y: 50,
        category: 'fabric',
      }],
    } : current);
  };

  const updateHotspot = (index: number, field: string, value: any) => {
    setEditingProduct((current) => {
      if (!current) return current;
      const hotspots = [...(current.hotspots || [])];
      if (!hotspots[index]) return current;
      hotspots[index] = { ...hotspots[index], [field]: value };
      return { ...current, hotspots };
    });
  };

  const deleteHotspot = (index: number) => {
    setEditingProduct((current) => {
      if (!current) return current;
      const hotspots = [...(current.hotspots || [])];
      hotspots.splice(index, 1);
      return { ...current, hotspots };
    });
    setEditingHotspotIndex((current) => current === index ? null : current !== null && current > index ? current - 1 : current);
  };

  const setHotspotPositionFromPointer = (index: number, event: React.PointerEvent<HTMLElement>, element?: HTMLElement | null) => {
    const rect = (element || event.currentTarget).getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    updateHotspot(index, 'x', Math.round(x));
    updateHotspot(index, 'y', Math.round(y));
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setImageTab('primary');
    setEditingProduct({
      name: '',
      subTitle: 'Confection Artisanale des Pyrénées',
      category: categoryOptions[0] || (products || []).map((product) => String(product.category || '').trim()).find(Boolean) || 'Signatures',
      price: 490,
      currency: '€',
      adminCost: 0,
      adminVatRate: 20,
      heroImage: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1000',
      gallery: [
        'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1000',
      ],
      description: 'Veste artisanale d\'exception tissée dans les Pyrénées.',
      longDescription: 'Fabriquée selon des savoir-faire d\'autrefois en pure laine sélectionnée.',
      tagline: 'L\'élégance des cimes',
      fabrics: ['Laine des Pyrénées 100% naturelle'],
      colors: [
        { name: 'Gris Aspe', hex: '#4a524b' },
        { name: 'Ocre Vignemale', hex: '#8c6b43' },
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      isAvailable: true,
      availabilityStatus: 'on-sale',
      features: [
        { iconName: 'Shield', title: 'Coupe-Vent', desc: 'Protection thermique haute montagne' },
      ],
      specs: {
        weight: '850g',
        waterResistance: 'Déperlante',
        warmthRating: 'Très élevée',
        fitType: 'Ajustée',
        origin: 'Atelier Pyrénées, France',
        care: 'Lavage délicat à la main ou nettoyage à sec',
      },
      hotspots: [],
      customSpecs: {},
    });
  };

  const handleStartEdit = (p: JacketModel) => {
    setIsCreating(false);
    setImageTab('primary');
    setEditingProduct(syncProductGallery(p));
  };

  const handleToggleAvailability = async (product: JacketModel) => {
    if (deferServerSave) {
      const updated = draftProducts.map((item) => item.id === product.id ? { ...item, isAvailable: !(item.isAvailable ?? true) } : item);
      setDraftProducts(updated);
      onProductsChange?.(updated);
      return;
    }
    setLoading(true);
    try {
      const newStatus = !product.isAvailable;
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            ...product,
            isAvailable: newStatus,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          `Produit « ${product.name} » ${newStatus ? 'activé' : 'désactivé'} avec succès.`
        );
        onRefreshProducts();
      } else {
        alert(data.message || 'Erreur lors du changement de disponibilité.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Erreur réseau lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (deferServerSave) {
      const target = draftProducts.find((item) => item.id === productId);
      if (!target) return;
      if (!window.confirm(`Supprimer « ${target.name} » de la liste des modifications ?`)) return;
      const updated = draftProducts.filter((item) => item.id !== productId);
      setDraftProducts(updated);
      onProductsChange?.(updated);
      return;
    }
    if (deletingProductId !== productId) {
      setDeletingProductId(productId);
      setTimeout(() => setDeletingProductId(null), 4000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Produit supprimé du catalogue avec succès.');
        setDeletingProductId(null);
        if (editingProduct?.id === productId) {
          setEditingProduct(null);
        }
        onRefreshProducts();
      } else {
        alert(data.message || 'Erreur lors de la suppression.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Erreur réseau lors de la suppression.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || editingProduct.price === undefined) {
      alert('Veuillez remplir au moins le nom et le prix du produit.');
      return;
    }

    if (deferServerSave) {
      const normalized = syncProductGallery({
        ...editingProduct,
        id: String(editingProduct.id || `produit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        name: String(editingProduct.name).trim(),
        price: Number(editingProduct.price),
        customSpecs: { ...(editingProduct.customSpecs || {}) },
      }) as JacketModel;
      const updated = isCreating
        ? [...draftProducts, normalized]
        : draftProducts.map((item) => item.id === normalized.id ? normalized : item);
      setDraftProducts(updated);
      onProductsChange?.(updated);
      showToast(isCreating ? `Produit « ${normalized.name} » ajouté aux modifications.` : `Produit « ${normalized.name} » modifié.`);
      setEditingProduct(null);
      setIsCreating(false);
      return;
    }

    setLoading(true);
    try {
      const method = isCreating ? 'POST' : 'PUT';
      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: editingProduct }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          isCreating
            ? `Nouveau produit « ${editingProduct.name} » créé avec succès.`
            : `Produit « ${editingProduct.name} » enregistré.`
        );
        setEditingProduct(null);
        setIsCreating(false);
        onRefreshProducts();
      } else {
        alert(data.message || 'Erreur lors de l\'enregistrement.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Erreur réseau lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="admin-product-modal-overlay"
      className={embedded
        ? "w-full h-full min-h-0"
        : "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1c261e] border border-[#d4af37] text-[#d4af37] text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div
        id="admin-product-modal-box"
        className={embedded
          ? "relative w-full bg-[#141a15] border border-[#3b4a3c] rounded-2xl shadow-xl text-[#e2d5c3] flex flex-col overflow-hidden"
          : "relative w-full max-w-6xl max-h-[92vh] bg-[#141a15] border border-[#3b4a3c] rounded-3xl shadow-2xl text-[#e2d5c3] flex flex-col overflow-hidden"}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#1a221c] border-b border-[#2e3b30] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#253227] text-[#d4af37] border border-[#3c4e40]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#f3ece0]">
                Gestion des Produits du Catalogue
              </h3>
              <p className="text-xs text-[#a3b1a5]">
                Création, modification, désactivation et suppression directe des modèles d'exception
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!editingProduct && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-4 py-2 rounded-xl bg-[#28362b] border border-[#d4af37] text-[#d4af37] hover:bg-[#344638] text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Créer un produit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#9ea99f] hover:text-white hover:bg-[#253026] transition-colors cursor-pointer"
              aria-label={embedded ? 'Revenir au panneau principal' : 'Fermer'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {editingProduct ? (
            /* PRODUCT EDIT / CREATE FORM */
            <form onSubmit={handleSaveProduct} className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#2d3a2f] pb-3">
                <div className="flex items-center space-x-2 text-[#d4af37]">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="font-serif text-base font-bold text-[#f3ece0]">
                    {isCreating ? 'Créer un nouveau produit' : `Modifier « ${editingProduct.name} »`}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="text-xs text-[#a3b1a5] hover:text-white underline cursor-pointer"
                >
                  ← Annuler et revenir à la liste
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#a3b1a5] font-semibold mb-1">Nom du Produit *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="ex: La Manteau Cauterets"
                    className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                


                <div>
                  <label className="block text-[#a3b1a5] font-semibold mb-1">Sous-Titre</label>
                  <input
                    type="text"
                    value={editingProduct.subTitle || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subTitle: e.target.value })}
                    placeholder="ex: Laine des Pyrénées & Finition Cuir"
                    className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[#a3b1a5] font-semibold mb-1">Ligne éditoriale du Showcase</label>
                  <input
                    type="text"
                    value={editingProduct.showcaseEyebrow || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, showcaseEyebrow: e.target.value })}
                    placeholder="ex: Haute Montagne & Élégance"
                    className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[#a3b1a5] font-semibold mb-1">Prix *</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={editingProduct.price ?? ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                    <select
                      value={editingProduct.currency || '€'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, currency: e.target.value })}
                      className="bg-[#121613] border border-[#38483b] text-white px-3 py-2.5 rounded-xl outline-none cursor-pointer"
                    >
                      <option value="€">€ (EUR)</option>
                      <option value="$">$ (USD)</option>
                      <option value="CHF">CHF</option>
                      <option value="£">£ (GBP)</option>
                    </select>
                  </div>
                </div>

<div className="md:col-span-2 p-4 rounded-2xl bg-[#111612] border border-[#6b5a24] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#d4af37] block">Données financières internes — Administration</span>
                      <span className="text-[10px] text-[#8f9d91]">Ces montants sont réservés à l’administration et servent aux commandes et aux rapports.</span>
                    </div>
                    <DollarSign className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#a3b1a5] mb-1">Coût de création de l’article</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingProduct.adminCost ?? 0}
                          onChange={(e) => setEditingProduct({ ...editingProduct, adminCost: Number(e.target.value) })}
                          className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                        />
                        <span className="text-xs text-[#a3b1a5]">{editingProduct.currency || '€'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#a3b1a5] mb-1">Chiffre d'affaires unitaire</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingProduct.adminRevenue ?? editingProduct.price ?? 0}
                          onChange={(e) => setEditingProduct({ ...editingProduct, adminRevenue: Number(e.target.value) })}
                          className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                        />
                        <span className="text-xs text-[#a3b1a5]">{editingProduct.currency || '€'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#a3b1a5] mb-1">Bénéfice unitaire</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.adminProfit ?? 0}
                          onChange={(e) => setEditingProduct({ ...editingProduct, adminProfit: Number(e.target.value) })}
                          className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                        />
                        <span className="text-xs text-[#a3b1a5]">{editingProduct.currency || '€'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#7f8d82]">Ces montants sont réservés à l’administration. Le coût de création correspond à votre coût réel de fabrication ; le CA et le bénéfice sont enregistrés par article.</p>
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-[#111612] border border-[#273429] space-y-3">
                  <div>
                    <span className="font-bold text-[#f3ece0] block">Statut de disponibilité</span>
                    <span className="text-[11px] text-[#a3b1a5]">Choisis l’état commercial de l’article. Il apparaît sous forme de pastille sur le Hero et le Lookbook.</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {([
                      ['on-sale', 'En vente'],
                      ['sold-out', 'Épuisé'],
                      ['coming-soon', 'Bientôt disponible'],
                    ] as [JacketAvailabilityStatus, string][]).map(([value, label]) => (
                      <button key={value} type="button" onClick={() => setEditingProduct({ ...editingProduct, availabilityStatus: value, isAvailable: value === 'on-sale' })} className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${getProductAvailabilityStatus(editingProduct as JacketModel) === value ? 'border-[#d4af37] bg-[#253127] text-[#d4af37]' : 'border-[#354238] bg-[#182019] text-[#a3b1a5] hover:border-[#526355]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[#a3b1a5] font-semibold">Catégorie / typologie</label>
                    <span className="text-[10px] uppercase tracking-wider text-[#718073]">1 choix</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 rounded-2xl border border-[#2e3b30] bg-[#111612] p-3">
                    {(categoryOptions.length ? categoryOptions : Array.from(new Set((draftProducts || []).map((product) => String(product.category || '').trim()).filter(Boolean)))).map((category) => {
                      const checked = String(editingProduct.category || '').trim().toLocaleLowerCase() === String(category).trim().toLocaleLowerCase();
                      return (
                        <label
                          key={category}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all ${checked ? 'border-[#d4af37] bg-[#273329] shadow-sm' : 'border-[#344437] bg-[#182019] hover:border-[#657467]'}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setEditingProduct({ ...editingProduct, category })}
                            className="sr-only"
                          />
                          <span className={`flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0 ${checked ? 'border-[#d4af37] bg-[#d4af37] text-[#121613]' : 'border-[#607063] bg-transparent'}`}>
                            {checked ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                          </span>
                          <span className={`text-xs font-semibold ${checked ? 'text-[#f3ece0]' : 'text-[#c2ccc4]'}`}>{category}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-[#718073] mt-2">Coche une seule catégorie. Elle détermine directement l’onglet public de l’article dans le Hero, le Showcase et le tableau comparatif. Les catégories se gèrent juste au-dessus dans « Paramétrage du catalogue ».</p>
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-[#111612] border border-[#2e3b30] space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-[#d4af37] block">Données financières internes — Administration</span>
                      <span className="text-[10px] text-[#8f9d91]">Le prix saisi est TTC. Le coût est votre coût de fabrication HT. Le CA HT, la TVA et le bénéfice HT sont calculés automatiquement.</span>
                    </div>
                    <DollarSign className="w-4 h-4 text-[#d4af37] shrink-0" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#a3b1a5] mb-1">Coût de création HT</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingProduct.adminCost ?? 0}
                          onChange={(e) => updateEditingProduct({ adminCost: Number(e.target.value) })}
                          className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                        />
                        <span className="text-xs text-[#a3b1a5]">{editingProduct.currency || '€'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#a3b1a5] mb-1">TVA</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={editingProduct.adminVatRate ?? 20}
                          onChange={(e) => updateEditingProduct({ adminVatRate: Number(e.target.value) })}
                          className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                        />
                        <span className="text-xs text-[#a3b1a5]">%</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#354238] bg-[#182019] px-3 py-2.5">
                      <span className="block text-[10px] uppercase tracking-wider text-[#a3b1a5]">Prix TTC</span>
                      <strong className="block text-[#f3ece0] mt-1">
                        {Number(editingProduct.price ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {editingProduct.currency || '€'}
                      </strong>
                    </div>
                  </div>

                  {(() => {
                    const ttc = Number(editingProduct.price ?? 0) || 0;
                    const vatRate = Math.max(0, Number(editingProduct.adminVatRate ?? 20) || 0);
                    const ht = vatRate > 0 ? ttc / (1 + vatRate / 100) : ttc;
                    const vat = ttc - ht;
                    const cost = Math.max(0, Number(editingProduct.adminCost ?? 0) || 0);
                    const profit = ht - cost;
                    const money = (value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${editingProduct.currency || '€'}`;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="rounded-xl border border-[#354238] bg-[#182019] px-3 py-2">
                          <span className="block text-[10px] uppercase tracking-wider text-[#a3b1a5]">CA HT unitaire</span>
                          <strong className="block text-[#f3ece0] mt-1">{money(ht)}</strong>
                        </div>
                        <div className="rounded-xl border border-[#354238] bg-[#182019] px-3 py-2">
                          <span className="block text-[10px] uppercase tracking-wider text-[#a3b1a5]">TVA collectée</span>
                          <strong className="block text-[#d4af37] mt-1">{money(vat)}</strong>
                        </div>
                        <div className={`rounded-xl border px-3 py-2 ${profit >= 0 ? 'border-[#354238] bg-[#182019]' : 'border-red-900/60 bg-red-950/20'}`}>
                          <span className="block text-[10px] uppercase tracking-wider text-[#a3b1a5]">Bénéfice HT unitaire</span>
                          <strong className={`block mt-1 ${profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{money(profit)}</strong>
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-[10px] text-[#7f8d82]">Formule : Prix TTC ÷ (1 + TVA) = CA HT. TVA = TTC − HT. Bénéfice HT = CA HT − coût de fabrication HT.</p>
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-[#111612] border border-[#273429] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#f3ece0] flex items-center gap-2"><Palette className="w-4 h-4 text-[#d4af37]" /> Pastilles & nuances</div>
                      <div className="text-[10px] text-[#7d8c7f] mt-1">Ces couleurs alimentent directement le sélecteur du produit.</div>
                    </div>
                    <button type="button" onClick={addColor} className="text-[#d4af37] text-[11px] font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(editingProduct.colors || []).map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-[#121613] border border-[#2e3b30]">
                        <input type="color" value={color.hex || '#526355'} onChange={(e) => updateColor(idx, 'hex', e.target.value)} className="w-8 h-8 bg-transparent cursor-pointer" />
                        <input value={color.name || ''} onChange={(e) => updateColor(idx, 'name', e.target.value)} className="min-w-0 flex-1 bg-[#1a221c] border border-[#38483b] text-xs text-white px-2 py-1.5 rounded-lg" />
                        {(editingProduct.colors || []).length > 1 && <button type="button" onClick={() => deleteColor(idx)} className="text-red-300 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-[#111612] border border-[#273429] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[#f3ece0] flex items-center gap-2"><Ruler className="w-4 h-4 text-[#d4af37]" /> Tailles disponibles</div>
                    <span className="text-[10px] text-[#a3b1a5]">{editingProduct.sizes?.length || 0} active(s)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(editingProduct.sizes || []).map((size, idx) => (
                      <div key={`${size}-${idx}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/50">
                        <span className="text-xs font-semibold text-[#f3ece0]">{size}</span>
                        <button type="button" onClick={() => deleteSize(idx)} className="text-red-300 hover:text-white cursor-pointer" title={`Supprimer ${size}`}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    {(editingProduct.sizes || []).length === 0 && <span className="text-xs text-[#7d8c7f]">Aucune taille définie.</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#263128]">
                    {['XS','S','M','L','XL','XXL','3XL','Sur Mesure'].filter((size) => !(editingProduct.sizes || []).includes(size)).map((size) => (
                      <button key={size} type="button" onClick={() => addSize(size)} className="px-2.5 py-1.5 rounded-lg bg-[#1e2720] text-[#a3b1a5] border border-[#374739] hover:border-[#d4af37] hover:text-[#d4af37] text-[11px] cursor-pointer">+ {size}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input id="custom-size-input" placeholder="Ajouter une taille…" className="flex-1 bg-[#121613] border border-[#38483b] text-xs text-white px-3 py-2 rounded-xl" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(e.currentTarget.value); e.currentTarget.value = ''; } }} />
                    <button type="button" onClick={() => { const input = document.getElementById('custom-size-input') as HTMLInputElement | null; if (input) { addSize(input.value); input.value = ''; } }} className="px-3 py-2 rounded-xl border border-[#d4af37] text-[#d4af37] text-xs font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
                  </div>
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-[#111612] border border-[#273429] space-y-4">
                  <div className="font-bold text-[#f3ece0] flex items-center gap-2"><Shield className="w-4 h-4 text-[#d4af37]" /> Caractéristiques & atouts</div>
                  {(editingProduct.features || []).map((feature, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-[150px_1fr_1.5fr_auto] gap-2 p-3 rounded-xl bg-[#121613] border border-[#2e3b30]">
                      <select value={feature.iconName || 'Shield'} onChange={(e) => updateFeature(idx, 'iconName', e.target.value)} className="bg-[#1a221c] border border-[#38483b] text-xs text-white px-2 py-2 rounded-lg"><option value="Shield">Bouclier</option><option value="Feather">Plume</option><option value="CloudRain">Pluie</option></select>
                      <input value={feature.title || ''} onChange={(e) => updateFeature(idx, 'title', e.target.value)} placeholder="Titre" className="bg-[#1a221c] border border-[#38483b] text-xs text-white px-2 py-2 rounded-lg" />
                      <input value={feature.desc || ''} onChange={(e) => updateFeature(idx, 'desc', e.target.value)} placeholder="Description" className="bg-[#1a221c] border border-[#38483b] text-xs text-white px-2 py-2 rounded-lg" />
                      <button type="button" onClick={() => deleteFeature(idx)} className="text-red-300 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addFeature} className="text-[#d4af37] text-[11px] font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Ajouter un atout</button>
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-[#111612] border border-[#273429] space-y-4">
                  <div className="font-bold text-[#f3ece0] flex items-center gap-2"><GripVertical className="w-4 h-4 text-[#d4af37]" /> Caractéristiques techniques</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {([
                      ['origin','Origine'],['warmthRating','Indice de chaleur'],['waterResistance','Imperméabilité'],['weight','Poids'],['fitType','Coupe'],['care','Entretien']
                    ] as const).map(([key,label]) => (
                      <div key={key}><label className="block text-[10px] text-[#a3b1a5] mb-1">{label}</label><input value={editingProduct.specs?.[key] || ''} onChange={(e) => setEditingProduct(current => current ? { ...current, specs: { ...(current.specs || {} as any), [key]: e.target.value } as any } : current)} className="w-full bg-[#121613] border border-[#38483b] text-xs text-white px-2.5 py-2 rounded-lg" /></div>
                    ))}
                    {technicalCriteria.filter((criterion) => !['category','fabric','warmth','water','weight','fit','care','price'].includes(criterion.key)).map((criterion) => (
                      <div key={criterion.id}>
                        <label className="block text-[10px] text-[#a3b1a5] mb-1">{criterion.label}</label>
                        <input value={editingProduct.customSpecs?.[criterion.key] || ''} onChange={(e) => setEditingProduct(current => current ? { ...current, customSpecs: { ...(current.customSpecs || {}), [criterion.key]: e.target.value } } : current)} className="w-full bg-[#121613] border border-[#38483b] text-xs text-white px-2.5 py-2 rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-[#111612] border border-[#273429] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#f3ece0] flex items-center gap-2"><Crosshair className="w-4 h-4 text-[#d4af37]" /> Points interactifs / hotspots</div>
                      <div className="text-[10px] text-[#7d8c7f] mt-1">Sélectionne un point puis clique ou glisse-le directement sur l'image pour régler X/Y.</div>
                    </div>
                    <button type="button" onClick={() => { addHotspot(); setEditingHotspotIndex((editingProduct?.hotspots || []).length); }} className="text-[#d4af37] text-[11px] font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Ajouter un point</button>
                  </div>

                  <div
                    className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-[#39483c] bg-[#080c09] flex items-center justify-center select-none"
                    onPointerDown={(event) => {
                      if (editingHotspotIndex !== null && event.target === event.currentTarget) setHotspotPositionFromPointer(editingHotspotIndex, event);
                    }}
                    onPointerMove={(event) => {
                      if (editingHotspotIndex !== null && (event.buttons & 1) === 1) setHotspotPositionFromPointer(editingHotspotIndex, event);
                    }}
                    onPointerUp={() => setEditingHotspotIndex(null)}
                    onPointerLeave={() => setEditingHotspotIndex(null)}
                  >
                    {editingProduct.heroImage ? (
                      <img src={editingProduct.heroImage} alt="Aperçu pour positionner les hotspots" className="absolute inset-0 w-full h-full object-contain pointer-events-none" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-xs text-[#647266]">Ajoute d'abord une image principale.</div>
                    )}
                    {(editingProduct.hotspots || []).map((spot, idx) => {
                      const selected = editingHotspotIndex === idx;
                      return (
                        <button
                          key={spot.id || idx}
                          type="button"
                          title={`Point #${idx + 1} — ${spot.title || 'Sans titre'}`}
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            setEditingHotspotIndex(idx);
                            event.currentTarget.setPointerCapture(event.pointerId);
                          }}
                          onPointerMove={(event) => {
                            if (editingHotspotIndex === idx && event.buttons === 1) setHotspotPositionFromPointer(idx, event, event.currentTarget.parentElement);
                          }}
                          onPointerUp={(event) => {
                            event.stopPropagation();
                            setEditingHotspotIndex(null);
                          }}
                          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shadow-xl transition-transform ${selected ? 'bg-[#d4af37] text-[#121613] border-white scale-110' : 'bg-[#141915] text-[#d4af37] border-[#d4af37] hover:scale-110'}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {(editingProduct.hotspots || []).map((spot, idx) => (
                    <div key={spot.id || idx} className="p-3 rounded-xl bg-[#121613] border border-[#2e3b30] space-y-3">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-[#d4af37]">Point #{idx + 1}</span><button type="button" onClick={() => deleteHotspot(idx)} className="text-red-300 text-[11px] cursor-pointer">Supprimer</button></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input value={spot.title || ''} onChange={(e) => updateHotspot(idx,'title',e.target.value)} placeholder="Titre" className="bg-[#1a221c] border border-[#38483b] text-xs text-white px-2 py-2 rounded-lg" />
                        <select value={spot.category || 'fabric'} onChange={(e) => updateHotspot(idx,'category',e.target.value)} className="bg-[#1a221c] border border-[#38483b] text-xs text-white px-2 py-2 rounded-lg"><option value="fabric">Matière</option><option value="hardware">Fournitures</option><option value="cut">Coupe</option><option value="utility">Usage</option></select>
                      </div>
                      <textarea rows={2} value={spot.description || ''} onChange={(e) => updateHotspot(idx,'description',e.target.value)} placeholder="Description explicative" className="w-full bg-[#1a221c] border border-[#38483b] text-xs text-white px-2 py-2 rounded-lg" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="text-[10px] text-[#a3b1a5]">X : {spot.x}%<input type="range" min="5" max="95" value={spot.x ?? 50} onChange={(e) => updateHotspot(idx,'x',Number(e.target.value))} className="w-full accent-[#d4af37]" /></label>
                        <label className="text-[10px] text-[#a3b1a5]">Y : {spot.y}%<input type="range" min="5" max="95" value={spot.y ?? 50} onChange={(e) => updateHotspot(idx,'y',Number(e.target.value))} className="w-full accent-[#d4af37]" /></label>
                      </div>
                    </div>
                  ))}
                  {(editingProduct.hotspots || []).length === 0 && <div className="text-center py-4 text-xs text-[#7d8c7f] border border-dashed border-[#374739] rounded-xl">Aucun hotspot configuré.</div>}
                </div>

              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#2d3a2f]">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#202922] text-[#a3b1a5] hover:text-white transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[#d4af37] text-[#121613] font-bold hover:brightness-110 transition-all flex items-center space-x-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Enregistrement...' : (deferServerSave ? 'Valider les modifications' : 'Enregistrer le Produit')}</span>
                </button>
              </div>
            </form>
          ) : (
            /* PRODUCTS LIST TABLE */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#a3b1a5]">
                <span>Catalogue officiel enregistré dans la base de données Upstash Redis ({products.length} article(s))</span>
                <span className="text-[#d4af37] font-semibold">{deferServerSave ? 'Modifications en attente — seront publiées avec Enregistrer & Appliquer' : 'Toutes les modifications sont synchronisées avec le serveur'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftProducts.map((p) => {
                  const productStatus = getProductAvailabilityStatus(p);
                  const isAvail = productStatus === 'on-sale';
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl bg-[#18201a] border transition-all flex flex-col justify-between space-y-3 ${
                        isAvail ? 'border-[#2d3a2f] hover:border-[#3d4f40]' : 'border-red-900/40 bg-red-950/10'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="relative h-40 rounded-xl overflow-hidden bg-[#0f1410] border border-[#273429]">
                          <img
                            src={p.heroImage}
                            alt={p.name}
                            className={`w-full h-full object-cover ${!isAvail ? 'opacity-40 grayscale' : ''}`}
                            referrerPolicy="no-referrer"
                          />
                          <span
                            className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-md ${
                              isAvail
                                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
                                : 'bg-red-950/90 text-red-300 border-red-800'
                            }`}
                          >
                            {getProductStatusLabel(p)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#d4af37] font-bold block">
                            Ref: {p.id}
                          </span>
                          <h4 className="font-serif text-base font-bold text-[#f3ece0]">{p.name}</h4>
                          <p className="text-xs text-[#a3b1a5] line-clamp-1">{p.subTitle}</p>
                        </div>

                        <div className="pt-2 border-t border-[#253227] text-xs space-y-1.5">
                          {(() => {
                            const ttc = Number(p.price ?? 0) || 0;
                            const vatRate = Math.max(0, Number(p.adminVatRate ?? 20) || 0);
                            const ht = vatRate > 0 ? ttc / (1 + vatRate / 100) : ttc;
                            const vat = ttc - ht;
                            const cost = Math.max(0, Number(p.adminCost ?? 0) || 0);
                            const profit = ht - cost;
                            const money = (value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${p.currency || '€'}`;
                            return (
                              <>
                                <div className="flex items-baseline justify-between gap-3">
                                  <span className="font-serif text-lg font-bold text-[#d4af37] whitespace-nowrap">{money(ttc)}</span>
                                  <span className="text-[10px] text-[#a3b1a5] text-right whitespace-nowrap">TTC · TVA {vatRate}%</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-[#a3b1a5]">
                                  <span>Coût HT <strong className="text-[#f3ece0]">{money(cost)}</strong></span>
                                  <span>CA HT <strong className="text-[#f3ece0]">{money(ht)}</strong></span>
                                  <span>TVA <strong className="text-[#d4af37]">{money(vat)}</strong></span>
                                  <span>Bénéfice HT <strong className={profit >= 0 ? 'text-emerald-300' : 'text-red-300'}>{money(profit)}</strong></span>
                                </div>
                              </>
                            );
                          })()}
                          <span className="text-[11px] text-[#a3b1a5]">
                            {p.sizes?.length || 0} taille(s) | {p.colors?.length || 0} nuance(s)
                          </span>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[#253227]">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(p)}
                          className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isAvail
                              ? 'bg-[#1e2a20] text-emerald-400 border-emerald-800/60 hover:bg-emerald-950'
                              : 'bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900'
                          }`}
                          title={isAvail ? 'Désactiver du site public' : 'Activer sur le site public'}
                        >
                          {isAvail ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#232e25] hover:bg-[#2d3a2f] border border-[#3b4c3e] text-xs font-bold text-[#f3ece0] flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Modifier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            deletingProductId === p.id
                              ? 'bg-red-600 text-white animate-pulse border-red-400 shadow-lg'
                              : 'bg-red-950/40 text-red-300 hover:bg-red-900/80 border-red-800/50'
                          }`}
                          title="Supprimer définitivement le produit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#111612] border-t border-[#2a362c] flex items-center justify-between text-xs text-[#a3b1a5] flex-shrink-0">
          <span>Maison des Pyrénées — Espace de gestion des modèles et tarifs du catalogue</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#243126] text-[#f3ece0] hover:bg-[#304133] transition-colors font-semibold cursor-pointer"
          >
            {embedded ? 'Retour au panneau' : 'Fermer le catalogue'}
          </button>
        </div>
      </div>
    </div>
  );
};
