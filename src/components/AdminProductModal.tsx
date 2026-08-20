import React, { useState } from 'react';
import { JacketModel } from '../types';
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
  Image as ImageIcon
} from 'lucide-react';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: JacketModel[];
  onRefreshProducts: () => void;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
}) => {
  const [editingProduct, setEditingProduct] = useState<Partial<JacketModel> | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<'primary' | 'secondary'>('primary');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getSecondaryImages = (product: Partial<JacketModel>) => {
    const gallery = Array.isArray(product.gallery) ? product.gallery : [];
    const hero = String(product.heroImage || gallery[0] || '').trim();
    return Array.from(new Set(gallery.map((url) => String(url || '').trim()).filter((url) => url !== hero)));
  };

  const syncProductGallery = (product: Partial<JacketModel>, heroImage?: string, secondaryImages?: string[]) => {
    const hero = String(heroImage ?? product.heroImage ?? '').trim();
    const secondary = (secondaryImages ?? getSecondaryImages(product))
      .map((url) => String(url || '').trim())
      .filter(Boolean)
      .filter((url) => url !== hero);
    return { ...product, heroImage: hero, gallery: Array.from(new Set([hero, ...secondary].filter(Boolean))) };
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

  const handleStartCreate = () => {
    setIsCreating(true);
    setImageTab('primary');
    setEditingProduct({
      name: '',
      subTitle: 'Confection Artisanale des Pyrénées',
      category: 'Homme & Femme',
      price: 490,
      currency: '€',
      heroImage: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1000',
      gallery: ['https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1000'],
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
    });
  };

  const handleStartEdit = (p: JacketModel) => {
    setIsCreating(false);
    setImageTab('primary');
    setEditingProduct(syncProductGallery(p));
  };

  const handleToggleAvailability = async (product: JacketModel) => {
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

    setLoading(true);
    try {
      const normalizedProduct = editingProduct ? syncProductGallery(editingProduct) : editingProduct;
      const method = isCreating ? 'POST' : 'PUT';
      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: normalizedProduct }),
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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
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
        className="relative w-full max-w-6xl max-h-[92vh] bg-[#141a15] border border-[#3b4a3c] rounded-3xl shadow-2xl text-[#e2d5c3] flex flex-col overflow-hidden"
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
              aria-label="Fermer"
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

                <div>
                  <label className="block text-[#a3b1a5] font-semibold mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    placeholder="ex: Homme, Femme, Unisept"
                    className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="md:col-span-2 rounded-2xl bg-[#111612] border border-[#344337] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d3a2f]">
                    <div>
                      <span className="block text-[#f3ece0] font-bold">Images de l’article</span>
                      <span className="text-[11px] text-[#a3b1a5]">L’image principale reste toujours la première image affichée sur le site.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSecondaryImage}
                      className="px-3 py-2 rounded-xl bg-[#28362b] border border-[#d4af37] text-[#d4af37] text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1.5 hover:bg-[#344638]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une image</span>
                    </button>
                  </div>

                  <div className="flex border-b border-[#2d3a2f]">
                    <button
                      type="button"
                      onClick={() => setImageTab('primary')}
                      className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors ${imageTab === 'primary' ? 'text-[#d4af37] bg-[#1d281f] border-b-2 border-[#d4af37]' : 'text-[#a3b1a5] hover:text-white'}`}
                    >
                      Image principale
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('secondary')}
                      className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors ${imageTab === 'secondary' ? 'text-[#d4af37] bg-[#1d281f] border-b-2 border-[#d4af37]' : 'text-[#a3b1a5] hover:text-white'}`}
                    >
                      Images secondaires ({getSecondaryImages(editingProduct).length})
                    </button>
                  </div>

                  <div className="p-4">
                    {imageTab === 'primary' ? (
                      <div className="space-y-3">
                        <label className="block text-[#a3b1a5] font-semibold">Image Principale (URL)</label>
                        <input
                          type="url"
                          value={editingProduct.heroImage || ''}
                          onChange={(e) => handleHeroImageChange(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                        />
                        {editingProduct.heroImage && (
                          <div className="h-32 rounded-xl overflow-hidden bg-[#0b0f0c] border border-[#273429]">
                            <img src={editingProduct.heroImage} alt={editingProduct.name || 'Image principale'} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <p className="text-[10px] text-[#78857b]">Cette image est utilisée en priorité dans les cartes, le showcase et le lookbook.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getSecondaryImages(editingProduct).length === 0 && (
                          <div className="rounded-xl border border-dashed border-[#3b4a3c] p-5 text-center text-xs text-[#89968d]">
                            Aucune image secondaire. Clique sur « Ajouter une image » pour créer le premier angle.
                          </div>
                        )}
                        {getSecondaryImages(editingProduct).map((url, index) => (
                          <div key={`${index}-${url}`} className="rounded-xl border border-[#344337] bg-[#151d17] p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] uppercase tracking-wider text-[#d4af37] font-bold">Image secondaire N°{index + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSecondaryImage(index)}
                                className="p-1.5 rounded-lg text-red-300 border border-red-900/60 hover:bg-red-950/60"
                                title="Supprimer cette image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="url"
                              value={url}
                              onChange={(e) => handleSecondaryImageChange(index, e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                            />
                            {url && (
                              <div className="h-24 rounded-lg overflow-hidden bg-[#0b0f0c] border border-[#273429]">
                                <img src={url} alt={`Image secondaire ${index + 1}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[#a3b1a5] font-semibold mb-1">Slogan (Tagline)</label>
                  <input
                    type="text"
                    value={editingProduct.tagline || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                    placeholder="ex: Une armure de douceur contre les grands froids"
                    className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[#a3b1a5] font-semibold mb-1">Description Courte</label>
                  <textarea
                    rows={2}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[#a3b1a5] font-semibold mb-1">Description Complète</label>
                  <textarea
                    rows={3}
                    value={editingProduct.longDescription || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, longDescription: e.target.value })}
                    className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[#a3b1a5] font-semibold mb-1">Tailles disponibles (séparées par virgule)</label>
                  <input
                    type="text"
                    value={editingProduct.sizes?.join(', ') || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        sizes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="XS, S, M, L, XL, XXL"
                    className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[#a3b1a5] font-semibold mb-1">Matières & Étoffes (séparées par virgule)</label>
                  <input
                    type="text"
                    value={editingProduct.fabrics?.join(', ') || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        fabrics: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Laine des Pyrénées, Cuir de bovin"
                    className="w-full bg-[#121613] border border-[#38483b] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-[#111612] border border-[#273429] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#f3ece0] block">Disponibilité à la vente</span>
                    <span className="text-[11px] text-[#a3b1a5]">
                      Si désactivé, le produit n'apparaîtra plus pour les clients sur le site public.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        isAvailable: !(editingProduct.isAvailable ?? true),
                      })
                    }
                    className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      (editingProduct.isAvailable ?? true)
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    {(editingProduct.isAvailable ?? true) ? (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Disponible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Désactivé</span>
                      </>
                    )}
                  </button>
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
                  <span>{loading ? 'Enregistrement...' : 'Enregistrer le Produit'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* PRODUCTS LIST TABLE */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#a3b1a5]">
                <span>Catalogue officiel enregistré dans la base de données Upstash Redis ({products.length} article(s))</span>
                <span className="text-[#d4af37] font-semibold">Toutes les modifications sont synchronisées avec le serveur</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => {
                  const isAvail = p.isAvailable !== false;
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
                            {isAvail ? 'En Vente' : 'Indisponible'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#d4af37] font-bold block">
                            Ref: {p.id}
                          </span>
                          <h4 className="font-serif text-base font-bold text-[#f3ece0]">{p.name}</h4>
                          <p className="text-xs text-[#a3b1a5] line-clamp-1">{p.subTitle}</p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-[#253227] text-xs">
                          <span className="font-serif text-lg font-bold text-[#d4af37]">
                            {p.price} {p.currency || '€'}
                          </span>
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
            Fermer le catalogue
          </button>
        </div>
      </div>
    </div>
  );
};
